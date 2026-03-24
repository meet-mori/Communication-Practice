import { AuthService } from './auth.service';
type AuthBody = {
    name?: string;
    email: string;
    password: string;
};
export declare class AuthController {
    private auth;
    constructor(auth: AuthService);
    register(body: AuthBody): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    login(body: AuthBody): Promise<{
        token: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    me(authHeader: string): Promise<{
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
}
export {};
