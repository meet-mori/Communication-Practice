import { GroqService } from '../groq/groq.service';
import { GrammarResult } from './grammar.service';
import { VocabularyResult } from './vocabulary.service';
import { CoachResult } from './coach.service';
export interface DailyTopicResult {
    topic: string;
    reason: string;
    practicePrompt: string;
}
export declare class DailyTopicService {
    private groq;
    constructor(groq: GroqService);
    handle(originalText: string, grammar: GrammarResult, vocabulary: VocabularyResult, coach: CoachResult): Promise<DailyTopicResult>;
}
