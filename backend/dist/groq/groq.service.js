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
exports.GroqService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
let GroqService = class GroqService {
    constructor(config) {
        this.config = config;
    }
    async chat(systemRole, userMessage) {
        try {
            const response = await axios_1.default.post('https://api.groq.com/openai/v1/chat/completions', {
                model: this.config.get('GROQ_MODEL'),
                messages: [
                    { role: 'system', content: systemRole },
                    { role: 'user', content: userMessage },
                ],
                temperature: 0.7,
                max_tokens: 1024,
            }, {
                headers: {
                    Authorization: `Bearer ${this.config.get('GROQ_API_KEY')}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data.choices[0].message.content;
        }
        catch (error) {
            console.error('Groq API Error:', error.response?.data || error.message);
            throw new common_1.HttpException('Groq API call failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.GroqService = GroqService;
exports.GroqService = GroqService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], GroqService);
//# sourceMappingURL=groq.service.js.map