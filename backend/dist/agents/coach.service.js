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
exports.CoachService = void 0;
const common_1 = require("@nestjs/common");
const groq_service_1 = require("../groq/groq.service");
let CoachService = class CoachService {
    constructor(groq) {
        this.groq = groq;
    }
    async handle(grammar, vocabulary) {
        const combinedContext = `
      Original text the user spoke: "${grammar.original}"
      After grammar correction: "${grammar.correctedText}"
      Grammar mistakes found: ${grammar.mistakes.length > 0 ? grammar.mistakes.join(' | ') : 'None'}
      After vocabulary improvement: "${vocabulary.enhancedText}"
      Vocabulary suggestions: ${vocabulary.suggestions.length > 0 ? vocabulary.suggestions.join(' | ') : 'None'}
    `;
        const response = await this.groq.chat(`You are a warm and encouraging English communication coach.
       Based on the full analysis provided, give a final evaluation.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "score": <integer from 1 to 10>,
         "summary": "2 to 3 sentence overall assessment of their English level",
         "encouragement": "one warm motivating sentence to keep them practicing"
       }`, combinedContext);
        try {
            const cleaned = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                score: parsed.score,
                summary: parsed.summary,
                encouragement: parsed.encouragement,
            };
        }
        catch {
            return {
                score: 5,
                summary: 'Could not parse coach response.',
                encouragement: 'Keep practicing every day!',
            };
        }
    }
};
exports.CoachService = CoachService;
exports.CoachService = CoachService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_service_1.GroqService])
], CoachService);
//# sourceMappingURL=coach.service.js.map