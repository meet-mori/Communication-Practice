import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as https from 'https';

@Injectable()
export class WhisperService {
  constructor(private config: ConfigService) {}

  async transcribe(filePath: string): Promise<string> {
    try {
      const fileSizeMB = fs.statSync(filePath).size / (1024 * 1024);
      console.log(`📦 File size: ${fileSizeMB.toFixed(2)} MB`);

      if (fileSizeMB > 25) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        throw new HttpException(
          'File too large. Maximum size is 25MB.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const fileBuffer = fs.readFileSync(filePath);

      const form = new FormData();
      form.append('file', fileBuffer, {
        filename: 'audio.mp3',
        contentType: 'audio/mpeg',
        knownLength: fileBuffer.length,
      });
      form.append('model', 'whisper-large-v3');
      form.append('language', 'en');
      form.append('response_format', 'text');

      console.log('📡 Sending to Groq Whisper API...');

      // Custom https agent to keep connection alive
      const httpsAgent = new https.Agent({
        keepAlive: true,
        timeout: 120000,
      });

      const response = await axios.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        form,
        {
          headers: {
            Authorization: `Bearer ${this.config.get<string>('GROQ_API_KEY')}`,
            ...form.getHeaders(),
          },
          httpsAgent,
          timeout: 120000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        },
      );

      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      const transcription =
        typeof response.data === 'string'
          ? response.data
          : response.data?.text || '';

      console.log(`✅ Transcription complete (${transcription.length} chars)`);
      return transcription.trim();

    } catch (error) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      if (error instanceof HttpException) throw error;

      if (error?.response?.status === 401) {
        throw new HttpException('Invalid Groq API Key — check your .env file', HttpStatus.UNAUTHORIZED);
      }

      if (error?.response?.status === 400) {
        const msg = error.response?.data?.error?.message || 'Invalid audio file';
        throw new HttpException(`Whisper error: ${msg}`, HttpStatus.BAD_REQUEST);
      }

      if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        console.error('Connection reset — file may be too large');
        throw new HttpException(
          'Connection was reset. Please use a shorter recording (1–2 minutes max).',
          HttpStatus.GATEWAY_TIMEOUT,
        );
      }

      console.error('Whisper Error:', error.response?.data || error.message);
      throw new HttpException(
        error.message || 'Transcription failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
