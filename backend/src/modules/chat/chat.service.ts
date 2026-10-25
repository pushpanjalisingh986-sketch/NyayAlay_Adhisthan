import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessageDto } from './dto/chat-message.dto';
import { KbService } from '../kb/kb.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly configService: ConfigService,
    private readonly kbService: KbService,
  ) {}

  async sendMessage(dto: ChatMessageDto) {
    const aiServiceUrl =
      this.configService.get<string>('aiServiceUrl') || 'http://ai-service:8000';
    const internalKey =
      this.configService.get<string>('internalServiceKey') ||
      'change_me_internal_service_key_min_32_chars';

    const text = (dto.message || '').toLowerCase();

    // Safety path: do NOT attach KB context for DV / crisis
    const isSafetyQuery = this.isSafetyQuery(text);

    let sources: Array<{
      articleTitle: string;
      lawVersion: string;
      content: string;
    }> = [];

    if (!isSafetyQuery) {
      const searchQuery = this.buildSearchQuery(dto.message);
      const kbResult = await this.kbService.search({
        query: searchQuery,
        limit: 1,
      });
      sources = kbResult.results.map((r) => ({
        articleTitle: r.articleTitle,
        lawVersion: r.lawVersion,
        content: r.content,
      }));
    }

    try {
      const response = await fetch(`${aiServiceUrl}/internal/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Key': internalKey,
        },
        body: JSON.stringify({
          message: dto.message,
          session_id: dto.sessionId || null,
          context: sources,
        }),
      });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'AI service is temporarily unavailable',
        );
      }

      const aiResult = await response.json();
      return {
        ...aiResult,
        sources:
          aiResult.sources && aiResult.sources.length > 0
            ? aiResult.sources
            : sources.map((s) => s.articleTitle),
      };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        'AI service is temporarily unavailable. Please try again later.',
      );
    }
  }

  private isSafetyQuery(text: string): boolean {
    const safetyKeywords = [
      'domestic violence',
      'husband beat',
      'husband is beating',
      'beating me',
      'beats me',
      'hitting me',
      'hit me',
      'wife beat',
      'dowry',
      '498a',
      'cruelty by husband',
      'domestic abuse',
      'abuse at home',
      'kill me',
      'suicide',
      'want to die',
      'threat to life',
      'scared for my life',
    ];
    return safetyKeywords.some((k) => text.includes(k));
  }

  private buildSearchQuery(message: string): string {
    const text = message.toLowerCase();

    if (/(stole|stolen|theft|chor|chori|robbery|snatching)/.test(text)) {
      return 'theft';
    }
    if (/(fir|police complaint|report to police|thana)/.test(text)) {
      return 'FIR';
    }
    if (/(bail|zamanat)/.test(text)) {
      return 'bail';
    }
    if (
      /(domestic violence|dowry|husband beat|husband is beating|beating me|wife beat|498a)/.test(
        text,
      )
    ) {
      return 'domestic violence';
    }
        if (
      /(right of representat|right to representat|right to counsel|legal representat|advocate present|lawyer present|denying lawyer|not allowing lawyer|violating my right|voilating my right)/.test(
        text,
      )
    ) {
      return 'legal representation';
    }
    if (/(consumer|refund|defective)/.test(text)) {
      return 'consumer';
    }
    if (/(rti|right to information)/.test(text)) {
      return 'RTI';
    }

    const stop = new Set([
      'someone',
      'something',
      'what',
      'does',
      'the',
      'law',
      'say',
      'how',
      'do',
      'i',
      'my',
      'a',
      'an',
      'to',
      'for',
      'of',
      'is',
      'please',
      'help',
      'me',
      'can',
      'you',
    ]);

    const words = text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w));

    return words.slice(0, 3).join(' ') || text.slice(0, 40);
  }
}