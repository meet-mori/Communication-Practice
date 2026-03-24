import { ConfigService } from '@nestjs/config';
export declare class GroqService {
    private config;
    constructor(config: ConfigService);
    chat(systemRole: string, userMessage: string): Promise<string>;
}
