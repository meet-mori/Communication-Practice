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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const mongo_service_1 = require("../db/mongo.service");
let AuthService = class AuthService {
    constructor(mongo) {
        this.mongo = mongo;
    }
    hashPassword(password) {
        const salt = (0, crypto_1.randomBytes)(16).toString('hex');
        const hash = (0, crypto_1.scryptSync)(password, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }
    verifyPassword(password, stored) {
        const [salt, savedHash] = stored.split(':');
        const hash = (0, crypto_1.scryptSync)(password, salt, 64);
        const saved = Buffer.from(savedHash, 'hex');
        return saved.length === hash.length && (0, crypto_1.timingSafeEqual)(saved, hash);
    }
    toSafeUser(user) {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
        };
    }
    async createSession(userId) {
        const token = (0, crypto_1.randomBytes)(32).toString('hex');
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await this.mongo.sessions().insertOne({
            userId,
            token,
            createdAt: now,
            expiresAt,
        });
        return token;
    }
    async register(name, email, password) {
        const cleanName = (name || '').trim();
        const cleanEmail = (email || '').trim().toLowerCase();
        if (!cleanName || !cleanEmail || !password) {
            throw new common_1.HttpException('Name, email and password are required', common_1.HttpStatus.BAD_REQUEST);
        }
        if (password.length < 6) {
            throw new common_1.HttpException('Password must be at least 6 characters', common_1.HttpStatus.BAD_REQUEST);
        }
        const existing = await this.mongo.users().findOne({ email: cleanEmail });
        if (existing) {
            throw new common_1.HttpException('Email already registered', common_1.HttpStatus.CONFLICT);
        }
        const result = await this.mongo.users().insertOne({
            name: cleanName,
            email: cleanEmail,
            passwordHash: this.hashPassword(password),
            createdAt: new Date(),
        });
        const user = await this.mongo.users().findOne({ _id: result.insertedId });
        const token = await this.createSession(result.insertedId);
        return { token, user: this.toSafeUser(user) };
    }
    async login(email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const user = await this.mongo.users().findOne({ email: cleanEmail });
        if (!user) {
            throw new common_1.HttpException('User not registered. Please register first.', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (!this.verifyPassword(password || '', user.passwordHash)) {
            throw new common_1.HttpException('Invalid email or password', common_1.HttpStatus.UNAUTHORIZED);
        }
        const token = await this.createSession(user._id);
        return { token, user: this.toSafeUser(user) };
    }
    async getUserFromToken(token) {
        if (!token)
            return null;
        const session = await this.mongo.sessions().findOne({ token });
        if (!session || session.expiresAt < new Date())
            return null;
        const user = await this.mongo.users().findOne({ _id: session.userId });
        if (!user) {
            await this.mongo.sessions().deleteOne({ _id: session._id });
            return null;
        }
        return this.toSafeUser(user);
    }
    async requireUser(token) {
        const user = await this.getUserFromToken(token);
        if (!user) {
            throw new common_1.HttpException('Unauthorized', common_1.HttpStatus.UNAUTHORIZED);
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mongo_service_1.MongoService])
], AuthService);
//# sourceMappingURL=auth.service.js.map