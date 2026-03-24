import { AuthService } from '../auth/auth.service';
import { MongoService } from '../db/mongo.service';
export interface CreateActivityBody {
    score: number;
    mode: 'text' | 'audio';
    inputText?: string;
    transcription?: string | null;
    topicSuggestion?: string | null;
}
export declare class ActivityService {
    private auth;
    private mongo;
    constructor(auth: AuthService, mongo: MongoService);
    private getLabel;
    create(token: string, body: CreateActivityBody): Promise<{
        ok: boolean;
    }>;
    myHistory(token: string, page?: number, limit?: number): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        items: {
            id: string;
            score: number;
            label: string;
            mode: "text" | "audio";
            inputTextSnippet: string;
            topicSuggestion: string;
            createdAt: Date;
        }[];
    }>;
}
