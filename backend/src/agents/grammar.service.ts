import { Injectable } from '@nestjs/common';
import { GroqService } from '../groq/groq.service';

export interface GrammarResult {
  original: string;
  correctedText: string;
  mistakes: string[];
}

@Injectable()
export class GrammarService {
  constructor(private groq: GroqService) {}

  async handle(rawText: string): Promise<GrammarResult> {
    const response = await this.groq.chat(
      `You are an English grammar expert.
       Analyze the given text carefully.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "correctedText": "the fully corrected sentence here",
         "mistakes": [
           "mistake 1 — explanation of what was wrong and why",
           "mistake 2 — explanation of what was wrong and why"
         ]
       }
       If there are no mistakes, return empty array for mistakes and return original as correctedText.`,
      rawText,
    );

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        original: rawText,
        correctedText: parsed.correctedText,
        mistakes: parsed.mistakes,
      };
    } catch {
      return {
        original: rawText,
        correctedText: rawText,
        mistakes: ['Could not parse grammar response'],
      };
    }
  }
}
