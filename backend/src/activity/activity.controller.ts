import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { ActivityService, CreateActivityBody } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private activity: ActivityService) {}

  private getToken(authHeader: string): string {
    return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
  }

  @Post()
  create(
    @Headers('authorization') authHeader: string,
    @Body() body: CreateActivityBody,
  ) {
    return this.activity.create(this.getToken(authHeader), body);
  }

  @Get('me')
  me(
    @Headers('authorization') authHeader: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activity.myHistory(
      this.getToken(authHeader),
      Number(page || 1),
      Number(limit || 20),
    );
  }
}
