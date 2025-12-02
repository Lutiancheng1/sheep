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
    for (let i = 0; i < rangeResult.length; i += 2) {
      const userId = rangeResult[i];
      const score = parseFloat(rangeResult[i + 1]);

      // Fetch user details
      // Optimization: We could cache user details in Redis or use MGET if we stored them there.
      // For now, querying DB is fine for small scale.
      const user = await this.usersService.findById(userId);

      leaderboard.push({
        rank: i / 2 + 1,
        userId,
        username: user ? user.username : 'Unknown',
        score,
      });
    }
    return leaderboard;
  }
}
