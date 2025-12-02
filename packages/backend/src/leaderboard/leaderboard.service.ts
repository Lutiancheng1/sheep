import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { UsersService } from '../users/users.service';

@Injectable()
export class LeaderboardService {
  private readonly logger = new Logger(LeaderboardService.name);

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly usersService: UsersService,
  ) {}

  async updateScores(userId: string, levelId: string, score: number) {
    // 1. Get current best score for this level
    const currentScoreStr = await this.redis.zscore(
      `leaderboard:level:${levelId}`,
      userId,
    );
    const currentScore = currentScoreStr ? parseFloat(currentScoreStr) : 0;

    // 2. If new score is higher, update both level and global leaderboards
    if (score > currentScore) {
      const delta = score - currentScore;

      this.logger.log(
        `更新用户 ${userId} 分数: 关卡 ${levelId} 新增 ${delta} (总分 ${score})`,
      );

      // Update level leaderboard with new best score
      await this.redis.zadd(`leaderboard:level:${levelId}`, score, userId);

      // Update global leaderboard by adding the difference (delta)
      // This ensures Total Score = Sum of Best Scores for each level
      await this.redis.zincrby('leaderboard:global', delta, userId);
    }
  }

  async getGlobalLeaderboard(limit: number = 10) {
    // Get top N users: ZREVRANGE 0 limit-1 WITHSCORES
    const result = await this.redis.zrevrange(
      'leaderboard:global',
      0,
      limit - 1,
      'WITHSCORES',
    );
    return this.mapLeaderboardData(result);
  }

  async getLevelLeaderboard(levelId: string, limit: number = 10) {
    const result = await this.redis.zrevrange(
      `leaderboard:level:${levelId}`,
      0,
      limit - 1,
      'WITHSCORES',
    );
    return this.mapLeaderboardData(result);
  }

  private async mapLeaderboardData(rangeResult: string[]) {
    const leaderboard = [];
    let rank = 1; // 真实排名计数器

    for (let i = 0; i < rangeResult.length; i += 2) {
      const userId = rangeResult[i];
      const score = parseFloat(rangeResult[i + 1]);

      // Fetch user details
      const user = await this.usersService.findById(userId);

      // 跳过已删除的用户，不显示在排行榜中
      if (!user) {
        this.logger.warn(`排行榜中发现已删除用户: ${userId}，已跳过`);
        continue;
      }

      leaderboard.push({
        rank,
        userId,
        username: user.username,
        score,
      });

      rank++;
    }
    return leaderboard;
  }
}
