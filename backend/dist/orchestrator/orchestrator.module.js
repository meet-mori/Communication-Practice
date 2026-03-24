"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const groq_module_1 = require("../groq/groq.module");
const grammar_service_1 = require("../agents/grammar.service");
const vocabulary_service_1 = require("../agents/vocabulary.service");
const coach_service_1 = require("../agents/coach.service");
const daily_topic_service_1 = require("../agents/daily-topic.service");
const whisper_service_1 = require("../upload/whisper.service");
const orchestrator_service_1 = require("./orchestrator.service");
const orchestrator_controller_1 = require("./orchestrator.controller");
const fs = require("fs");
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir))
    fs.mkdirSync(uploadsDir);
let OrchestratorModule = class OrchestratorModule {
};
exports.OrchestratorModule = OrchestratorModule;
exports.OrchestratorModule = OrchestratorModule = __decorate([
    (0, common_1.Module)({
        imports: [
            groq_module_1.GroqModule,
            platform_express_1.MulterModule.register({
                storage: (0, multer_1.diskStorage)({
                    destination: './uploads',
                    filename: (req, file, cb) => {
                        cb(null, `audio_${Date.now()}.mp3`);
                    },
                }),
                fileFilter: (req, file, cb) => {
                    if (file.mimetype === 'audio/mpeg' || file.originalname.endsWith('.mp3')) {
                        cb(null, true);
                    }
                    else {
                        cb(new Error('Only MP3 files are allowed'), false);
                    }
                },
                limits: { fileSize: 25 * 1024 * 1024 },
            }),
        ],
        providers: [
            grammar_service_1.GrammarService,
            vocabulary_service_1.VocabularyService,
            coach_service_1.CoachService,
            daily_topic_service_1.DailyTopicService,
            whisper_service_1.WhisperService,
            orchestrator_service_1.OrchestratorService,
        ],
        controllers: [orchestrator_controller_1.OrchestratorController],
    })
], OrchestratorModule);
//# sourceMappingURL=orchestrator.module.js.map