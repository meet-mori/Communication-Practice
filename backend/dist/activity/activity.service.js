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
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const mongodb_1 = require("mongodb");
const auth_service_1 = require("../auth/auth.service");
const mongo_service_1 = require("../db/mongo.service");
let ActivityService = class ActivityService {
    constructor(auth, mongo) {
        this.auth = auth;
        this.mongo = mongo;
    }
    getLabel(score) {
        if (score >= 9)
            return 'Excellent';
        if (score >= 7)
            return 'Good';
        if (score >= 5)
            return 'Fair';
        return 'Needs Work';
    }
    async create(token, body) {
        const user = await this.auth.requireUser(token);
        const score = Number(body.score);
        if (Number.isNaN(score) || score < 0 || score > 10) {
            throw new common_1.HttpException('Invalid score', common_1.HttpStatus.BAD_REQUEST);
        }
        const mode = body.mode === 'audio' ? 'audio' : 'text';
        const input = (body.inputText || '').trim();
        const snippet = input ? input.slice(0, 240) : 'Audio session';
        await this.mongo.activities().insertOne({
            userId: new mongodb_1.ObjectId(user.id),
            score,
            label: this.getLabel(score),
            mode,
            inputTextSnippet: snippet,
            transcription: body.transcription || null,
            topicSuggestion: body.topicSuggestion || null,
            createdAt: new Date(),
        });
        return { ok: true };
    }
    async myHistory(token, page = 1, limit = 20) {
        const user = await this.auth.requireUser(token);
        const safePage = Math.max(Number(page) || 1, 1);
        const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 5000);
        const query = { userId: new mongodb_1.ObjectId(user.id) };
        const total = await this.mongo.activities().countDocuments(query);
        const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
        const skip = (safePage - 1) * safeLimit;
        const rows = await this.mongo.activities()
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit)
            .toArray();
        return {
            user,
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages,
            },
            items: rows.map(row => ({
                id: row._id?.toString(),
                score: row.score,
                label: row.label,
                mode: row.mode,
                inputTextSnippet: row.inputTextSnippet,
                topicSuggestion: row.topicSuggestion || null,
                createdAt: row.createdAt,
            })),
        };
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        mongo_service_1.MongoService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map