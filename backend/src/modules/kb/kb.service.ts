import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { SearchKbDto } from './dto/search-kb.dto';
import { EmbeddingClient } from './embedding.client';

@Injectable()
export class KbService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingClient: EmbeddingClient,
  ) {}

  async createArticle(dto: CreateArticleDto) {
    const article = await this.prisma.kbArticle.create({
      data: {
        title: dto.title,
        body: dto.body,
        category: dto.category,
        lawVersion: dto.lawVersion,
        effectiveDate: new Date(dto.effectiveDate),
        tags: dto.tags || [],
      },
    });

    const chunks = this.chunkText(dto.body, 500);
    let embeddedCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const content = chunks[i];
      let embeddingLiteral: string | null = null;

      try {
        const vector = await this.embeddingClient.embed(content);
        embeddingLiteral = `[${vector.join(',')}]`;
      } catch {
        embeddingLiteral = null;
      }

      if (embeddingLiteral) {
        await this.prisma.$executeRaw`
          INSERT INTO kb_chunks
            (id, article_id, chunk_index, content, law_version, effective_date, embedding, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${article.id}::uuid,
            ${i},
            ${content},
            ${dto.lawVersion}::"LawVersion",
            ${new Date(dto.effectiveDate)},
            ${embeddingLiteral}::vector,
            NOW(),
            NOW()
          )
        `;
        embeddedCount += 1;
      } else {
        await this.prisma.kbChunk.create({
          data: {
            articleId: article.id,
            chunkIndex: i,
            content,
            lawVersion: dto.lawVersion,
            effectiveDate: new Date(dto.effectiveDate),
          },
        });
      }
    }

    return {
      article,
      chunksCreated: chunks.length,
      embeddedCount,
    };
  }

  async search(dto: SearchKbDto) {
    const limit = dto.limit || 5;
    const raw = (dto.query || '').trim();
    const lower = raw.toLowerCase();

    const terms = lower
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2)
      .slice(0, 6);

    const searchTerms = terms.length > 0 ? terms : [lower];

    const topicTerms = [
      'fir',
      'theft',
      'bail',
      'domestic',
      'violence',
      'consumer',
      'refund',
      'rti',
    ].filter((t) => lower.includes(t));

    type Ranked = {
      chunkId: string;
      content: string;
      articleId: string;
      articleTitle: string;
      lawVersion: string;
      effectiveDate: Date;
      score: number;
    };

    const byId = new Map<string, Ranked>();

    try {
      const queryVec = await this.embeddingClient.embed(raw);
      const literal = `[${queryVec.join(',')}]`;

      const rows: Array<{
        id: string;
        content: string;
        articleId: string;
        title: string;
        lawVersion: string;
        effectiveDate: Date;
        distance: number;
      }> = await this.prisma.$queryRaw`
        SELECT
          c.id,
          c.content,
          c.article_id AS "articleId",
          a.title,
          a.law_version::text AS "lawVersion",
          a.effective_date AS "effectiveDate",
          (c.embedding <=> ${literal}::vector) AS distance
        FROM kb_chunks c
        JOIN kb_articles a ON a.id = c.article_id
        WHERE c.embedding IS NOT NULL
        ORDER BY c.embedding <=> ${literal}::vector
        LIMIT 20
      `;

      for (const r of rows) {
        const vectorScore = 1 / (1 + Number(r.distance));
        byId.set(r.id, {
          chunkId: r.id,
          content: r.content,
          articleId: r.articleId,
          articleTitle: r.title,
          lawVersion: r.lawVersion,
          effectiveDate: r.effectiveDate,
          score: vectorScore,
        });
      }
    } catch {
      // vector path optional
    }

    const chunks = await this.prisma.kbChunk.findMany({
      where: {
        OR: searchTerms.map((term) => ({
          content: {
            contains: term,
            mode: 'insensitive' as const,
          },
        })),
      },
      take: 20,
      include: {
        article: {
          select: {
            id: true,
            title: true,
            lawVersion: true,
            effectiveDate: true,
            tags: true,
          },
        },
      },
    });

    for (const c of chunks) {
      const content = (c.content || '').toLowerCase();
      const title = (c.article.title || '').toLowerCase();
      const tags = (c.article.tags || []).map((t) => t.toLowerCase());

      let lexical = 0;
      for (const term of searchTerms) {
        if (title.includes(term)) lexical += 5;
        if (tags.some((t) => t.includes(term))) lexical += 4;
        if (content.includes(term)) lexical += 2;
      }

      for (const t of topicTerms) {
        if (title.includes(t)) lexical += 8;
        if (content.includes(t)) lexical += 3;
      }

      if (content.length < 80) lexical -= 4;

      const lexicalScore = Math.max(lexical, 0) / 20;
      const prev = byId.get(c.id);

      if (prev) {
        prev.score = prev.score * 0.4 + lexicalScore * 0.6;
      } else if (lexical > 0) {
        byId.set(c.id, {
          chunkId: c.id,
          content: c.content,
          articleId: c.article.id,
          articleTitle: c.article.title,
          lawVersion: c.article.lawVersion,
          effectiveDate: c.article.effectiveDate,
          score: lexicalScore,
        });
      }
    }

    const ranked = Array.from(byId.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      query: dto.query,
      count: ranked.length,
      mode: byId.size > 0 ? 'hybrid' : 'empty',
      results: ranked,
    };
  }

  async backfillEmbeddings() {
    const chunks = await this.prisma.kbChunk.findMany({
      select: {
        id: true,
        content: true,
      },
      take: 200,
    });

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (const chunk of chunks) {
      const existing: Array<{ has_embedding: boolean }> =
        await this.prisma.$queryRaw`
          SELECT (embedding IS NOT NULL) AS has_embedding
          FROM kb_chunks
          WHERE id = ${chunk.id}::uuid
        `;

      if (existing[0]?.has_embedding) {
        skipped += 1;
        continue;
      }

      try {
        const vector = await this.embeddingClient.embed(chunk.content);
        const literal = `[${vector.join(',')}]`;

        await this.prisma.$executeRaw`
          UPDATE kb_chunks
          SET embedding = ${literal}::vector,
              updated_at = NOW()
          WHERE id = ${chunk.id}::uuid
        `;
        updated += 1;
      } catch {
        failed += 1;
      }
    }

    return {
      scanned: chunks.length,
      updated,
      skipped,
      failed,
    };
  }

  async getArticle(id: string) {
    const article = await this.prisma.kbArticle.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  private chunkText(text: string, maxLen: number): string[] {
    const sentences = text.split(/(?<=[.?!])\s+/);
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).trim().length > maxLen) {
        if (current.trim()) chunks.push(current.trim());
        current = sentence;
      } else {
        current = (current + ' ' + sentence).trim();
      }
    }

    if (current.trim()) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
  }
}