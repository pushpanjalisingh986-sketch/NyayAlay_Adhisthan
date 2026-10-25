import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Public()
  @Post('message')
  async sendMessage(@Body() dto: ChatMessageDto) {
    return this.chatService.sendMessage(dto);
  }
}