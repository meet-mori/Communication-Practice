import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GroqModule } from './groq/groq.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { MongoModule } from './db/mongo.module';
import { AuthModule } from './auth/auth.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongoModule,
    GroqModule,
    AuthModule,
    ActivityModule,
    OrchestratorModule,
  ],
})
export class AppModule {}
