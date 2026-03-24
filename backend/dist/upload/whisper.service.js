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
exports.WhisperService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const https = require("https");
let WhisperService = class WhisperService {
    constructor(config) {
        this.config = config;
    }
    async transcribe(filePath) {
        try {
            const fileSizeMB = fs.statSync(filePath).size / (1024 * 1024);
            console.log(`📦 File size: ${fileSizeMB.toFixed(2)} MB`);
            if (fileSizeMB > 25) {
                if (fs.existsSync(filePath))
                    fs.unlinkSync(filePath);
                throw new common_1.HttpException('File too large. Maximum size is 25MB.', common_1.HttpStatus.BAD_REQUEST);
            }
            const fileBuffer = fs.readFileSync(filePath);
            const form = new FormData();
            form.append('file', fileBuffer, {
                filename: 'audio.mp3',
                contentType: 'audio/mpeg',
                knownLength: fileBuffer.length,
            });
            form.append('model', 'whisper-large-v3');
            form.append('language', 'en');
            form.append('response_format', 'text');
            console.log('📡 Sending to Groq Whisper API...');
            const httpsAgent = new https.Agent({
                keepAlive: true,
                timeout: 120000,
            });
            const response = await axios_1.default.post('https://api.groq.com/openai/v1/audio/transcriptions', form, {
                headers: {
                    Authorization: `Bearer ${this.config.get('GROQ_API_KEY')}`,
                    ...form.getHeaders(),
                },
                httpsAgent,
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            });
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);
            const transcription = typeof response.data === 'string'
                ? response.data
                : response.data?.text || '';
            console.log(`✅ Transcription complete (${transcription.length} chars)`);
            return transcription.trim();
        }
        catch (error) {
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);
            if (error instanceof common_1.HttpException)
                throw error;
            if (error?.response?.status === 401) {
                throw new common_1.HttpException('Invalid Groq API Key — check your .env file', common_1.HttpStatus.UNAUTHORIZED);
            }
            if (error?.response?.status === 400) {
                const msg = error.response?.data?.error?.message || 'Invalid audio file';
                throw new common_1.HttpException(`Whisper error: ${msg}`, common_1.HttpStatus.BAD_REQUEST);
            }
            if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
                console.error('Connection reset — file may be too large');
                throw new common_1.HttpException('Connection was reset. Please use a shorter recording (1–2 minutes max).', common_1.HttpStatus.GATEWAY_TIMEOUT);
            }
            console.error('Whisper Error:', error.response?.data || error.message);
            throw new common_1.HttpException(error.message || 'Transcription failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.WhisperService = WhisperService;
exports.WhisperService = WhisperService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhisperService);
//# sourceMappingURL=whisper.service.js.map