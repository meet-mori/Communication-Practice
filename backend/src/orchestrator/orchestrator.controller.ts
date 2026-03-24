import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Sse,
  Res,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  MessageEvent,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable, map } from 'rxjs';
import { OrchestratorService } from './orchestrator.service';
import { WhisperService } from '../upload/whisper.service';
import { Response } from 'express';

// In-memory store for audio transcriptions waiting for SSE
const pendingTranscriptions = new Map<string, string>();

@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private service: OrchestratorService,
    private whisper: WhisperService,
  ) {}

  // ── Step 1: Upload audio → get sessionId back ─────────────────────────
  @Post('upload-audio')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('Audio file is required', HttpStatus.BAD_REQUEST);
    }
    console.log(`🎵 Audio received: ${file.filename} (${(file.size / 1024).toFixed(1)} KB)`);

    const transcription = await this.whisper.transcribe(file.path);
    console.log('✅ Transcription done:', transcription.substring(0, 80) + '...');

    // Store transcription with a session id — SSE will pick it up
    const sessionId = `sess_${Date.now()}`;
    pendingTranscriptions.set(sessionId, transcription);

    // Auto-clean after 5 minutes
    setTimeout(() => pendingTranscriptions.delete(sessionId), 5 * 60 * 1000);

    return { sessionId, transcription };
  }

  // ── Step 2: SSE stream — connect and receive live agent events ─────────
  @Sse('stream')
  streamPipeline(
    @Query('sessionId') sessionId: string,
    @Query('text') text: string,
    @Query('isAudio') isAudio: string,
  ): Observable<MessageEvent> {

    const isAudioBool = isAudio === 'true';
    let transcription: string | undefined;
    let userText = text || '';

    // If audio session — retrieve transcription from store
    if (isAudioBool && sessionId) {
      transcription = pendingTranscriptions.get(sessionId);
      if (!transcription) {
        throw new HttpException('Session not found or expired', HttpStatus.NOT_FOUND);
      }
      userText = transcription;
      pendingTranscriptions.delete(sessionId); 
    }

    // Run SSE pipeline and convert events to MessageEvent format
    return this.service
      .runPipelineSSE(userText, isAudioBool, transcription)
      .pipe(
        map(event => ({
          data: JSON.stringify(event),  // SSE data must be a string
        } as MessageEvent)),
      );
  }
}
