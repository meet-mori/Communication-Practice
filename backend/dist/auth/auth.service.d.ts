import { JwtService } from '@nestjs/jwt';
import { MongoService } from '../db/mongo.service';
export declare class AuthService {
    private mongo;
    private jwtService;
    constructor(mongo: MongoService, jwtService: JwtService);
    private hashPassword;
    private verifyPassword;
    private toSafeUser;
    private createToken;
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
