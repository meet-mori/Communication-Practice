import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

type AuthBody = {
  name?: string;
  email: string;
  password: string;
};

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() body: AuthBody) {
    return this.auth.register(body.name || '', body.email, body.password);
  }

  @Post('login')
  login(@Body() body: AuthBody) {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader: string) {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const user = await this.auth.requireUser(token);
    return { user };
  }
}
