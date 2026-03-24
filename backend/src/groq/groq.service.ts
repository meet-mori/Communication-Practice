import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GroqService {
  constructor(private config: ConfigService) {}

  async chat(systemRole: string, userMessage: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: this.config.get<string>('GROQ_MODEL'),
          messages: [
            { role: 'system', content: systemRole },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        },
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('GROQ_API_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      throw new HttpException('Groq API call failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
