import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingClient {
  constructor(private readonly configService: ConfigService) {}

  async embed(text: string): Promise<number[]> {
    const aiServiceUrl =
      this.configService.get<string>('aiServiceUrl') || 'http://ai-service:8000';
    const internalKey =
      this.configService.get<string>('internalServiceKey') ||
      'change_me_internal_service_key_min_32_chars';

    const response = await fetch(`${aiServiceUrl}/internal/v1/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': internalKey,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Embedding service failed: ${response.status}`);
    }

    const data = await response.json();
    return data.embedding as number[];
  }
}