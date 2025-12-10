import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProgress } from './game-progress.entity';

import { LeaderboardService } from '../leaderboard/leaderboard.service';

@Injectable()
export class GameProgressService {
  private readonly logger = new Logger(GameProgressService.name);

  constructor(
    @InjectRepository(GameProgress)
    private progressRepository: Repository<GameProgress>,
    private leaderboardService: LeaderboardService,
  ) {}

  async create(
    userId: string,
    levelUuid: string,
    status: string,
    score: number,
  ): Promise<GameProgress> {
    this.logger.log(
      `保存游戏进度 - userId: ${userId}, levelUuid: ${levelUuid}, status: ${status}, score: ${score}`,
    );

    try {
      const progress = this.progressRepository.create({
        user: { id: userId }, // Map to user relation
        levelUuid,
        status,
        score,
      });
      const savedProgress = await this.progressRepository.save(progress);
      this.logger.log(`游戏进度已保存 - progressId: ${savedProgress.id}`);

      if (status === 'completed') {
        // Update scores (handles best score logic and global accumulation)
        this.logger.log(`更新排行榜分数...`);
        await this.leaderboardService.updateScores(userId, levelUuid, score);
        this.logger.log(`排行榜分数更新完成`);
      }

      return savedProgress;
    } catch (error) {
      this.logger.error(`保存失败:`, error);
      throw error;
    }
  }

  async findByUser(userId: string): Promise<GameProgress[]> {
    return this.progressRepository.find({
      where: { userId },
      order: { completedAt: 'DESC' },
    });
  }

  async getUnlockedLevels(userId: string): Promise<string[]> {
    // 优化: 使用 DISTINCT 查询数据库，避免拉取所有记录
    const result = await this.progressRepository
      .createQueryBuilder('progress')
      .select('DISTINCT progress.levelUuid', 'levelUuid')
      .where('progress.userId = :userId', { userId })
      .andWhere('progress.status = :status', { status: 'completed' })
      .getRawMany<{ levelUuid: string }>();

    return result.map((row) => row.levelUuid);
  }
}
