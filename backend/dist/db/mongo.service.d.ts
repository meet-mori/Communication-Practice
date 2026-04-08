import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, ObjectId } from 'mongodb';
export interface UserDoc {
    _id?: ObjectId;
    name: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
}
export interface ActivityDoc {
    _id?: ObjectId;
    userId: ObjectId;
    score: number;
    label: string;
    mode: 'text' | 'audio';
    inputTextSnippet: string;
    transcription?: string | null;
    topicSuggestion?: string | null;
    createdAt: Date;
}
export declare class MongoService implements OnModuleInit, OnModuleDestroy {
    private config;
    private client;
    private db;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    users(): Collection<UserDoc>;
    activities(): Collection<ActivityDoc>;
}
