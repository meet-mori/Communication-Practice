import { GroqService } from '../groq/groq.service';
export interface GrammarResult {
    original: string;
    correctedText: string;
    mistakes: string[];
}
export declare class GrammarService {
    private groq;
    constructor(groq: GroqService);
    handle(rawText: string): Promise<GrammarResult>;
}
