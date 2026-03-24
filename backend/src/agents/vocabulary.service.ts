import { Injectable } from '@nestjs/common';
import { GroqService } from '../groq/groq.service';

export interface VocabularyResult {
  enhancedText: string;
  suggestions: string[];
}

@Injectable()
export class VocabularyService {
  constructor(private groq: GroqService) {}

  async handle(correctedText: string): Promise<VocabularyResult> {
    const response = await this.groq.chat(
      `You are an English vocabulary coach.
       Take the given sentence and improve word choices to sound more natural and fluent.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "enhancedText": "the sentence rewritten with better vocabulary",
         "suggestions": [
           "word X was replaced with Y because...",
           "word A was replaced with B because..."
         ]
       }
       If no improvements needed, return original as enhancedText and empty suggestions array.`,
      correctedText,
    );

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        enhancedText: parsed.enhancedText,
        suggestions: parsed.suggestions,
      };
    } catch {
      return {
        enhancedText: correctedText,
        suggestions: ['Could not parse vocabulary response'],
      };
    }
  }
}
