import { MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { OrchestratorService } from './orchestrator.service';
import { WhisperService } from '../upload/whisper.service';
export declare class OrchestratorController {
    private service;
    private whisper;
    constructor(service: OrchestratorService, whisper: WhisperService);
    uploadAudio(file: Express.Multer.File): Promise<{
        sessionId: string;
        transcription: string;
    }>;
    streamPipeline(sessionId: string, text: string, isAudio: string): Observable<MessageEvent>;
}
