import { Observable } from 'rxjs';
import { GrammarService, GrammarResult } from '../agents/grammar.service';
import { VocabularyService, VocabularyResult } from '../agents/vocabulary.service';
import { CoachService, CoachResult } from '../agents/coach.service';
import { DailyTopicService, DailyTopicResult } from '../agents/daily-topic.service';
export interface PipelineEvent {
    type: 'transcribing' | 'transcribed' | 'grammar_start' | 'grammar_done' | 'vocabulary_start' | 'vocabulary_done' | 'coach_start' | 'coach_done' | 'daily_topic_start' | 'daily_topic_done' | 'complete' | 'error';
    data?: any;
    message?: string;
}
export interface PipelineResult {
    step1_grammar: GrammarResult;
    step2_vocabulary: VocabularyResult;
    step3_coach: CoachResult;
    step4_daily_topic: DailyTopicResult;
}
export declare class OrchestratorService {
    private grammarService;
    private vocabularyService;
    private coachService;
    private dailyTopicService;
    constructor(grammarService: GrammarService, vocabularyService: VocabularyService, coachService: CoachService, dailyTopicService: DailyTopicService);
    private wait;
    private extractUserSpeech;
    private trimText;
    runPipelineSSE(userText: string, isAudio: boolean, transcription?: string): Observable<PipelineEvent>;
}
