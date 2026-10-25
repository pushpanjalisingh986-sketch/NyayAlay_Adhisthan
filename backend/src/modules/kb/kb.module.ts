import { Module } from '@nestjs/common';
import { KbService } from './kb.service';
import { KbController } from './kb.controller';
import { EmbeddingClient } from './embedding.client';

@Module({
  controllers: [KbController],
  providers: [KbService, EmbeddingClient],
  exports: [KbService],
})
export class KbModule {}