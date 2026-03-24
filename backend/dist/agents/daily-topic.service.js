"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyTopicService = void 0;
const common_1 = require("@nestjs/common");
const groq_service_1 = require("../groq/groq.service");
let DailyTopicService = class DailyTopicService {
    constructor(groq) {
        this.groq = groq;
    }
    async handle(originalText, grammar, vocabulary, coach) {
        const context = `
      User text: "${originalText}"
      Corrected text: "${grammar.correctedText}"
      Vocabulary enhanced text: "${vocabulary.enhancedText}"
      Coach score: ${coach.score}
      Coach summary: "${coach.summary}"
    `;
        const response = await this.groq.chat(`You are a friendly English practice planner.
       Suggest one daily practice topic that is relevant to the user's current level.
       The topic must be non-technical and suitable for everyday conversation.
       Avoid coding, software, engineering, science, or technical jargon.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "topic": "short non-technical daily topic",
         "reason": "one sentence why this topic is relevant for the learner",
         "practicePrompt": "one practical speaking prompt for today"
       }`, context);
        try {
            const cleaned = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                topic: parsed.topic,
                reason: parsed.reason,
                practicePrompt: parsed.practicePrompt,
            };
        }
        catch {
            return {
                topic: 'Talking about your daily routine',
                reason: 'This helps build confidence with common everyday English.',
                practicePrompt: 'Speak for 2 minutes about your morning and evening routine.',
            };
        }
    }
};
exports.DailyTopicService = DailyTopicService;
exports.DailyTopicService = DailyTopicService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_service_1.GroqService])
], DailyTopicService);
//# sourceMappingURL=daily-topic.service.js.map