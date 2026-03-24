import { MongoService } from '../db/mongo.service';
export declare class AuthService {
    private mongo;
    constructor(mongo: MongoService);
    private hashPassword;
    private verifyPassword;
    private toSafeUser;
    private createSession;
    register(name: string, email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    getUserFromToken(token: string): Promise<{
        id: string;
        name: string;
        email: string;
    }>;
    requireUser(token: string): Promise<{
        id: string;
        name: string;
        email: string;
    }>;
}
