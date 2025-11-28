import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  async getGlobalLeaderboard(@Query('limit') limit: number) {
    return this.leaderboardService.getGlobalLeaderboard(limit ? Number(limit) : 10);
  }

  @Get('level/:levelId')
  async getLevelLeaderboard(@Param('levelId') levelId: string, @Query('limit') limit: number) {
    return this.leaderboardService.getLevelLeaderboard(levelId, limit ? Number(limit) : 10);
  }
}
