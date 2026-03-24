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
exports.VocabularyService = void 0;
const common_1 = require("@nestjs/common");
const groq_service_1 = require("../groq/groq.service");
let VocabularyService = class VocabularyService {
    constructor(groq) {
        this.groq = groq;
    }
    async handle(correctedText) {
        const response = await this.groq.chat(`You are an English vocabulary coach.
       Take the given sentence and improve word choices to sound more natural and fluent.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "enhancedText": "the sentence rewritten with better vocabulary",
         "suggestions": [
           "word X was replaced with Y because...",
           "word A was replaced with B because..."
         ]
       }
       If no improvements needed, return original as enhancedText and empty suggestions array.`, correctedText);
        try {
            const cleaned = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                enhancedText: parsed.enhancedText,
                suggestions: parsed.suggestions,
            };
        }
        catch {
            return {
                enhancedText: correctedText,
                suggestions: ['Could not parse vocabulary response'],
            };
        }
    }
};
exports.VocabularyService = VocabularyService;
exports.VocabularyService = VocabularyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_service_1.GroqService])
], VocabularyService);
//# sourceMappingURL=vocabulary.service.js.map