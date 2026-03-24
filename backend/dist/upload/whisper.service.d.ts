import { ConfigService } from '@nestjs/config';
export declare class WhisperService {
    private config;
    constructor(config: ConfigService);
    transcribe(filePath: string): Promise<string>;
}
