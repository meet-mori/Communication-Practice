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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const rxjs_1 = require("rxjs");
const orchestrator_service_1 = require("./orchestrator.service");
const whisper_service_1 = require("../upload/whisper.service");
const pendingTranscriptions = new Map();
let OrchestratorController = class OrchestratorController {
    constructor(service, whisper) {
        this.service = service;
        this.whisper = whisper;
    }
    async uploadAudio(file) {
        if (!file) {
            throw new common_1.HttpException('Audio file is required', common_1.HttpStatus.BAD_REQUEST);
        }
        console.log(`🎵 Audio received: ${file.filename} (${(file.size / 1024).toFixed(1)} KB)`);
        const transcription = await this.whisper.transcribe(file.path);
        console.log('✅ Transcription done:', transcription.substring(0, 80) + '...');
        const sessionId = `sess_${Date.now()}`;
        pendingTranscriptions.set(sessionId, transcription);
        setTimeout(() => pendingTranscriptions.delete(sessionId), 5 * 60 * 1000);
        return { sessionId, transcription };
    }
    streamPipeline(sessionId, text, isAudio) {
        const isAudioBool = isAudio === 'true';
        let transcription;
        let userText = text || '';
        if (isAudioBool && sessionId) {
            transcription = pendingTranscriptions.get(sessionId);
            if (!transcription) {
                throw new common_1.HttpException('Session not found or expired', common_1.HttpStatus.NOT_FOUND);
            }
            userText = transcription;
            pendingTranscriptions.delete(sessionId);
        }
        return this.service
            .runPipelineSSE(userText, isAudioBool, transcription)
            .pipe((0, rxjs_1.map)(event => ({
            data: JSON.stringify(event),
        })));
    }
};
exports.OrchestratorController = OrchestratorController;
__decorate([
    (0, common_1.Post)('upload-audio'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "uploadAudio", null);
__decorate([
    (0, common_1.Sse)('stream'),
    __param(0, (0, common_1.Query)('sessionId')),
    __param(1, (0, common_1.Query)('text')),
    __param(2, (0, common_1.Query)('isAudio')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", rxjs_1.Observable)
], OrchestratorController.prototype, "streamPipeline", null);
exports.OrchestratorController = OrchestratorController = __decorate([
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [orchestrator_service_1.OrchestratorService,
        whisper_service_1.WhisperService])
], OrchestratorController);
//# sourceMappingURL=orchestrator.controller.js.map