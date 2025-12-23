import { Controller, Get, Param, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardEntryDto } from './dto/leaderboard-entry.dto';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('global')
  async getGlobalLeaderboard(@Query('limit') limit: number): Promise<LeaderboardEntryDto[]> {
    return this.leaderboardService.getGlobalLeaderboard(limit ? Number(limit) : 10);
  }

  @Get('level/:levelUuid')
  async getLevelLeaderboard(
    @Param('levelUuid') levelUuid: string,
    @Query('limit') limit: number,
  ): Promise<LeaderboardEntryDto[]> {
    return this.leaderboardService.getLevelLeaderboard(levelUuid, limit ? Number(limit) : 10);
  }
}
