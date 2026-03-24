import { GroqService } from '../groq/groq.service';
export interface VocabularyResult {
    enhancedText: string;
    suggestions: string[];
}
export declare class VocabularyService {
    private groq;
    constructor(groq: GroqService);
    handle(correctedText: string): Promise<VocabularyResult>;
}
