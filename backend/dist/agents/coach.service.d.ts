import { GroqService } from '../groq/groq.service';
import { GrammarResult } from './grammar.service';
import { VocabularyResult } from './vocabulary.service';
export interface CoachResult {
    score: number;
    summary: string;
    encouragement: string;
}
export declare class CoachService {
    private groq;
    constructor(groq: GroqService);
    handle(grammar: GrammarResult, vocabulary: VocabularyResult): Promise<CoachResult>;
}
