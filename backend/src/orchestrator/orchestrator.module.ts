import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { GroqModule } from '../groq/groq.module';
import { GrammarService } from '../agents/grammar.service';
import { VocabularyService } from '../agents/vocabulary.service';
import { CoachService } from '../agents/coach.service';
import { DailyTopicService } from '../agents/daily-topic.service';
import { WhisperService } from '../upload/whisper.service';
import { OrchestratorService } from './orchestrator.service';
import { OrchestratorController } from './orchestrator.controller';
import * as fs from 'fs';

// Ensure uploads folder exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

@Module({
  imports: [
    GroqModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          cb(null, `audio_${Date.now()}.mp3`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg' || file.originalname.endsWith('.mp3')) {
          cb(null, true);
        } else {
          cb(new Error('Only MP3 files are allowed'), false);
        }
      },
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  ],
  providers: [
    GrammarService,
    VocabularyService,
    CoachService,
    DailyTopicService,
    WhisperService,
    OrchestratorService,
  ],
  controllers: [OrchestratorController],
})
export class OrchestratorModule {}
