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
const jwt_1 = require("@nestjs/jwt");
const crypto_1 = require("crypto");
const mongodb_1 = require("mongodb");
const mongo_service_1 = require("../db/mongo.service");
let AuthService = class AuthService {
    constructor(mongo, jwtService) {
        this.mongo = mongo;
        this.jwtService = jwtService;
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
    async createToken(user) {
        return this.jwtService.signAsync({
            sub: user._id.toString(),
            email: user.email,
            name: user.name,
        });
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
        const safeUser = this.toSafeUser(user);
        const token = await this.createToken(user);
        return { token, user: safeUser };
    }
    async login(email, password) {
        const cleanEmail = (email || '').trim().toLowerCase();
        const user = await this.mongo.users().findOne({ email: cleanEmail });
        if (!user) {
            throw new common_1.HttpException('Invalid email or password!.', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (!this.verifyPassword(password || '', user.passwordHash)) {
            throw new common_1.HttpException('Invalid email or password!', common_1.HttpStatus.UNAUTHORIZED);
        }
        const safeUser = this.toSafeUser(user);
        const token = await this.createToken(user);
        return { token, user: safeUser };
    }
    async getUserFromToken(token) {
        if (!token)
            return null;
        try {
            const payload = await this.jwtService.verifyAsync(token);
            if (!payload?.sub)
                return null;
            const user = await this.mongo.users().findOne({ _id: new mongodb_1.ObjectId(payload.sub) });
            if (!user)
                return null;
            return this.toSafeUser(user);
        }
        catch {
            return null;
        }
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
    __metadata("design:paramtypes", [mongo_service_1.MongoService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map