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
exports.MongoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongodb_1 = require("mongodb");
let MongoService = class MongoService {
    constructor(config) {
        this.config = config;
    }
    async onModuleInit() {
        const uri = this.config.get('MONGODB_URI') || 'mongodb+srv://Meet_Mori:Meet%4099099@cluster0.zljbnwf.mongodb.net/english_coach';
        const dbName = this.config.get('MONGODB_DB') || 'english_coach';
        this.client = new mongodb_1.MongoClient(uri);
        await this.client.connect();
        this.db = this.client.db(dbName);
        await this.users().createIndex({ email: 1 }, { unique: true });
        await this.sessions().createIndex({ token: 1 }, { unique: true });
        await this.sessions().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await this.activities().createIndex({ userId: 1, createdAt: -1 });
    }
    async onModuleDestroy() {
        if (this.client)
            await this.client.close();
    }
    users() {
        return this.db.collection('users');
    }
    sessions() {
        return this.db.collection('sessions');
    }
    activities() {
        return this.db.collection('activities');
    }
};
exports.MongoService = MongoService;
exports.MongoService = MongoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MongoService);
//# sourceMappingURL=mongo.service.js.map