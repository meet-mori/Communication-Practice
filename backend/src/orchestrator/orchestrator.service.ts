import { Injectable } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { GrammarService, GrammarResult } from '../agents/grammar.service';
import { VocabularyService, VocabularyResult } from '../agents/vocabulary.service';
import { CoachService, CoachResult } from '../agents/coach.service';
import { DailyTopicService, DailyTopicResult } from '../agents/daily-topic.service';

// SSE event shape
export interface PipelineEvent {
  type:
    | 'transcribing'
    | 'transcribed'
    | 'grammar_start'
    | 'grammar_done'
    | 'vocabulary_start'
    | 'vocabulary_done'
    | 'coach_start'
    | 'coach_done'
    | 'daily_topic_start'
    | 'daily_topic_done'
    | 'complete'
    | 'error';
  data?: any;
  message?: string;
}

export interface PipelineResult {
  step1_grammar: GrammarResult;
  step2_vocabulary: VocabularyResult;
  step3_coach: CoachResult;
  step4_daily_topic: DailyTopicResult;
}

@Injectable()
export class OrchestratorService {
  constructor(
    private grammarService: GrammarService,
    private vocabularyService: VocabularyService,
    private coachService: CoachService,
    private dailyTopicService: DailyTopicService,
  ) {}

  private wait(ms: number) {
    return new Promise(r => setTimeout(r, ms));
  }

  private extractUserSpeech(text: string): string {
    const lines = text.split(/(?<=[.!?])\s+/);
    const userLines = lines.filter(line => {
      const wordCount = line.trim().split(/\s+/).length;
      const lower = line.toLowerCase();
      if (wordCount <= 40) return true;
      if (lower.includes('i think') || lower.includes('i want') ||
          lower.includes('i mean') || lower.includes('can we') ||
          lower.includes('so yeah') || lower.includes('yeah so') ||
          lower.includes('am i correct') || lower.includes('what about') ||
          lower.includes('i understood')) return true;
      return false;
    });
    const extracted = userLines.join(' ').trim();
    console.log(`🎯 Extracted user speech: ${extracted.split(/\s+/).length} words`);
    return extracted;
  }

  private trimText(text: string, maxWords = 400): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    console.log(`✂️  Trimmed to ${maxWords} words`);
    return words.slice(0, maxWords).join(' ') + '...';
  }

  // ── SSE Pipeline — streams events as each agent runs ─────────────────
  runPipelineSSE(userText: string, isAudio: boolean, transcription?: string): Observable<PipelineEvent> {
    const subject = new Subject<PipelineEvent>();

    // Run async pipeline and emit events into the subject
    (async () => {
      try {
        console.log('\n🚀 SSE Pipeline started');

        // Step 0 — prepare text
        let processedText = userText;
        if (isAudio && transcription) {
          processedText = this.extractUserSpeech(transcription);
          if (!processedText || processedText.split(/\s+/).length < 5) {
            processedText = transcription;
          }
          // Emit transcription event so frontend can show chat bubbles
          subject.next({ type: 'transcribed', data: { transcription } });
        }
        const safeText = this.trimText(processedText, 400);

        // Step 1 + Step 2 — Grammar and Vocabulary run in parallel
        subject.next({ type: 'grammar_start', message: 'Grammar Agent analyzing your text...' });
        subject.next({ type: 'vocabulary_start', message: 'Vocabulary Agent improving word choices...' });
        console.log('📝 Grammar Agent running...');
        console.log('📚 Vocabulary Agent running...');

        const grammarPromise = this.grammarService.handle(safeText);
        const vocabPromise = this.vocabularyService.handle(safeText);

        const step1 = await grammarPromise;                
        subject.next({ type: 'grammar_done', data: step1 });
        console.log('✅ Grammar Agent done');       

        const step2 = await vocabPromise;
        subject.next({ type: 'vocabulary_done', data: step2 });
        console.log('✅ Vocabulary Agent done');

        await this.wait(2000);

        // Step 3 — Coach Agent
        subject.next({ type: 'coach_start', message: 'Coach Agent writing your final report...' });
        console.log('🎯 Coach Agent running...');
        const step3 = await this.coachService.handle(step1, step2);
        subject.next({ type: 'coach_done', data: step3 });
        console.log('✅ Coach Agent done');

        await this.wait(5000);

        // Step 4 - Daily Topic Agent
        subject.next({ type: 'daily_topic_start', message: 'Daily Topic Agent selecting your non-technical practice topic...' });
        console.log('🗓️ Daily Topic Agent running...');
        const step4 = await this.dailyTopicService.handle(safeText, step1, step2, step3);
        subject.next({ type: 'daily_topic_done', data: step4 });
        console.log('✅ Daily Topic Agent done');

        // Complete — send full result
        subject.next({
          type: 'complete',
          data: {
            transcription: transcription || null,
            step1_grammar: step1,
            step2_vocabulary: step2,
            step3_coach: step3,
            step4_daily_topic: step4,
          },
        });

        console.log('🏁 SSE Pipeline complete!\n');
        subject.complete();
      } catch (err: any) {
        console.error('Pipeline SSE error:', err.message);
        subject.next({ type: 'error', message: err.message || 'Pipeline failed' });
        subject.complete();
      }
    })();

    return subject.asObservable();
  }
}
