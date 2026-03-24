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
exports.GrammarService = void 0;
const common_1 = require("@nestjs/common");
const groq_service_1 = require("../groq/groq.service");
let GrammarService = class GrammarService {
    constructor(groq) {
        this.groq = groq;
    }
    async handle(rawText) {
        const response = await this.groq.chat(`You are an English grammar expert.
       Analyze the given text carefully.
       Respond in this EXACT JSON format only. No extra text, no markdown, no code blocks:
       {
         "correctedText": "the fully corrected sentence here",
         "mistakes": [
           "mistake 1 — explanation of what was wrong and why",
           "mistake 2 — explanation of what was wrong and why"
         ]
       }
       If there are no mistakes, return empty array for mistakes and return original as correctedText.`, rawText);
        try {
            const cleaned = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(cleaned);
            return {
                original: rawText,
                correctedText: parsed.correctedText,
                mistakes: parsed.mistakes,
            };
        }
        catch {
            return {
                original: rawText,
                correctedText: rawText,
                mistakes: ['Could not parse grammar response'],
            };
        }
    }
};
exports.GrammarService = GrammarService;
exports.GrammarService = GrammarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [groq_service_1.GroqService])
], GrammarService);
//# sourceMappingURL=grammar.service.js.map