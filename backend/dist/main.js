"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const express = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    process.on('uncaughtException', (err) => {
        if (err?.code === 'ECONNRESET') {
            console.warn('⚠️  ECONNRESET caught — connection dropped by client');
        }
        else {
            console.error('Uncaught Exception:', err);
        }
    });
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.enableCors({ origin: 'http://localhost:4200' });
    await app.listen(3000);
    console.log('✅ Backend running on http://localhost:3000');
}
bootstrap();
//# sourceMappingURL=main.js.map