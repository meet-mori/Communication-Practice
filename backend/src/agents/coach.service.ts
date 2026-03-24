import { Injectable } from '@nestjs/common';
import { GroqService } from '../groq/groq.service';
import { GrammarResult } from './grammar.service';
import { VocabularyResult } from './vocabulary.service';

export interface CoachResult {
  score: number;
  summary: string;
  encouragement: string;
}

@Injectable()
export class CoachService {
  constructor(private groq: GroqService) {}

  async handle(grammar: GrammarResult, vocabulary: VocabularyResult): Promise<CoachResult> {
    const combinedContext = `
      Original text the user spoke: "${grammar.original}"
      After grammar correction: "${grammar.correctedText}"
      Grammar mistakes found: ${grammar.mistakes.length > 0 ? grammar.mistakes.join(' | ') : 'None'}
      After vocabulary improvement: "${vocabulary.enhancedText}"
      Vocabulary suggestions: ${vocabulary.suggestions.length > 0 ? vocabulary.suggestions.join(' | ') : 'None'}
    `;

    const response = await this.groq.chat(
      `You are a warm and encouraging English communication coach.
       Based on the full analysis provided, give a final evaluation.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "score": <integer from 1 to 10>,
         "summary": "2 to 3 sentence overall assessment of their English level",
         "encouragement": "one warm motivating sentence to keep them practicing"
       }`,
      combinedContext,
    );

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        score: parsed.score,
        summary: parsed.summary,
        encouragement: parsed.encouragement,
      };
    } catch {
      return {
        score: 5,
        summary: 'Could not parse coach response.',
        encouragement: 'Keep practicing every day!',
      };
    }
  }
}
