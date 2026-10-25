import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { KbService } from './kb.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { SearchKbDto } from './dto/search-kb.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('kb')
export class KbController {
  constructor(private readonly kbService: KbService) {}

  @Public()
  @Post('articles')
  createArticle(@Body() dto: CreateArticleDto) {
    return this.kbService.createArticle(dto);
  }

  @Public()
  @Get('search')
  search(@Query() dto: SearchKbDto) {
    return this.kbService.search(dto);
  }

  @Public()
  @Get('articles/:id')
  getArticle(@Param('id') id: string) {
    return this.kbService.getArticle(id);
  }

  @Public()
  @Post('backfill-embeddings')
  backfillEmbeddings() {
    return this.kbService.backfillEmbeddings();
  }
}