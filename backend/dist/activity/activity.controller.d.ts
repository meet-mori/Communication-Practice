import { ActivityService, CreateActivityBody } from './activity.service';
export declare class ActivityController {
    private activity;
    constructor(activity: ActivityService);
    private getToken;
    create(authHeader: string, body: CreateActivityBody): Promise<{
        ok: boolean;
    }>;
    me(authHeader: string, page?: string, limit?: string): Promise<{
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
