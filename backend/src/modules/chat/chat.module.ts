import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { KbModule } from '../kb/kb.module';

@Module({
  imports: [KbModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}