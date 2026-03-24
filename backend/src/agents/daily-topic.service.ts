import { Injectable } from '@nestjs/common';
import { GroqService } from '../groq/groq.service';
import { GrammarResult } from './grammar.service';
import { VocabularyResult } from './vocabulary.service';
import { CoachResult } from './coach.service';

export interface DailyTopicResult {
  topic: string;
  reason: string;
  practicePrompt: string;
}

@Injectable()
export class DailyTopicService {
  constructor(private groq: GroqService) {}

  async handle(
    originalText: string,
    grammar: GrammarResult,
    vocabulary: VocabularyResult,
    coach: CoachResult,
  ): Promise<DailyTopicResult> {
    const context = `
      User text: "${originalText}"
      Corrected text: "${grammar.correctedText}"
      Vocabulary enhanced text: "${vocabulary.enhancedText}"
      Coach score: ${coach.score}
      Coach summary: "${coach.summary}"
    `;

    const response = await this.groq.chat(
      `You are a friendly English practice planner.
       Suggest one daily practice topic that is relevant to the user's current level.
       The topic must be non-technical and suitable for everyday conversation.
       Avoid coding, software, engineering, science, or technical jargon.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "topic": "short non-technical daily topic",
         "reason": "one sentence why this topic is relevant for the learner",
         "practicePrompt": "one practical speaking prompt for today"
       }`,
      context,
    );

    try {
      const cleaned = response.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        topic: parsed.topic,
        reason: parsed.reason,
        practicePrompt: parsed.practicePrompt,
      };
    } catch {
      return {
        topic: 'Talking about your daily routine',
        reason: 'This helps build confidence with common everyday English.',
        practicePrompt: 'Speak for 2 minutes about your morning and evening routine.',
      };
    }
  }
}
