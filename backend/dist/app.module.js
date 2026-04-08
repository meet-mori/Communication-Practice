"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const groq_module_1 = require("./groq/groq.module");
const orchestrator_module_1 = require("./orchestrator/orchestrator.module");
const mongo_module_1 = require("./db/mongo.module");
const auth_module_1 = require("./auth/auth.module");
const activity_module_1 = require("./activity/activity.module");
const response_envelope_interceptor_1 = require("./common/response-envelope.interceptor");
const http_exception_filter_1 = require("./common/http-exception.filter");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            mongo_module_1.MongoModule,
            groq_module_1.GroqModule,
            auth_module_1.AuthModule,
            activity_module_1.ActivityModule,
            orchestrator_module_1.OrchestratorModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: response_envelope_interceptor_1.ResponseEnvelopeInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: http_exception_filter_1.HttpExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map