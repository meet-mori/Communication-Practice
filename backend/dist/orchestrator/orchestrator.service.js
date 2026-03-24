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
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const grammar_service_1 = require("../agents/grammar.service");
const vocabulary_service_1 = require("../agents/vocabulary.service");
const coach_service_1 = require("../agents/coach.service");
const daily_topic_service_1 = require("../agents/daily-topic.service");
let OrchestratorService = class OrchestratorService {
    constructor(grammarService, vocabularyService, coachService, dailyTopicService) {
        this.grammarService = grammarService;
        this.vocabularyService = vocabularyService;
        this.coachService = coachService;
        this.dailyTopicService = dailyTopicService;
    }
    wait(ms) {
        return new Promise(r => setTimeout(r, ms));
    }
    extractUserSpeech(text) {
        const lines = text.split(/(?<=[.!?])\s+/);
        const userLines = lines.filter(line => {
            const wordCount = line.trim().split(/\s+/).length;
            const lower = line.toLowerCase();
            if (wordCount <= 40)
                return true;
            if (lower.includes('i think') || lower.includes('i want') ||
                lower.includes('i mean') || lower.includes('can we') ||
                lower.includes('so yeah') || lower.includes('yeah so') ||
                lower.includes('am i correct') || lower.includes('what about') ||
                lower.includes('i understood'))
                return true;
            return false;
        });
        const extracted = userLines.join(' ').trim();
        console.log(`🎯 Extracted user speech: ${extracted.split(/\s+/).length} words`);
        return extracted;
    }
    trimText(text, maxWords = 400) {
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords)
            return text;
        console.log(`✂️  Trimmed to ${maxWords} words`);
        return words.slice(0, maxWords).join(' ') + '...';
    }
    runPipelineSSE(userText, isAudio, transcription) {
        const subject = new rxjs_1.Subject();
        (async () => {
            try {
                console.log('\n🚀 SSE Pipeline started');
                let processedText = userText;
                if (isAudio && transcription) {
                    processedText = this.extractUserSpeech(transcription);
                    if (!processedText || processedText.split(/\s+/).length < 5) {
                        processedText = transcription;
                    }
                    subject.next({ type: 'transcribed', data: { transcription } });
                }
                const safeText = this.trimText(processedText, 400);
                subject.next({ type: 'grammar_start', message: 'Grammar Agent analyzing your text...' });
                subject.next({ type: 'vocabulary_start', message: 'Vocabulary Agent improving word choices...' });
                console.log('📝 Grammar Agent running...');
                console.log('📚 Vocabulary Agent running...');
                const grammarPromise = this.grammarService.handle(safeText);
                const vocabPromise = this.vocabularyService.handle(safeText);
                const step1 = await grammarPromise;
                subject.next({ type: 'grammar_done', data: step1 });
                console.log('✅ Grammar Agent done');
                const step2 = await vocabPromise;
                subject.next({ type: 'vocabulary_done', data: step2 });
                console.log('✅ Vocabulary Agent done');
                await this.wait(2000);
                subject.next({ type: 'coach_start', message: 'Coach Agent writing your final report...' });
                console.log('🎯 Coach Agent running...');
                const step3 = await this.coachService.handle(step1, step2);
                subject.next({ type: 'coach_done', data: step3 });
                console.log('✅ Coach Agent done');
                await this.wait(5000);
                subject.next({ type: 'daily_topic_start', message: 'Daily Topic Agent selecting your non-technical practice topic...' });
                console.log('🗓️ Daily Topic Agent running...');
                const step4 = await this.dailyTopicService.handle(safeText, step1, step2, step3);
                subject.next({ type: 'daily_topic_done', data: step4 });
                console.log('✅ Daily Topic Agent done');
                subject.next({
                    type: 'complete',
                    data: {
                        transcription: transcription || null,
                        step1_grammar: step1,
                        step2_vocabulary: step2,
                        step3_coach: step3,
                        step4_daily_topic: step4,
                    },
                });
                console.log('🏁 SSE Pipeline complete!\n');
                subject.complete();
            }
            catch (err) {
                console.error('Pipeline SSE error:', err.message);
                subject.next({ type: 'error', message: err.message || 'Pipeline failed' });
                subject.complete();
            }
        })();
        return subject.asObservable();
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [grammar_service_1.GrammarService,
        vocabulary_service_1.VocabularyService,
        coach_service_1.CoachService,
        daily_topic_service_1.DailyTopicService])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map