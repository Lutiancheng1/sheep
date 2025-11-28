import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameProgress } from './game-progress.entity';

import { LeaderboardService } from '../leaderboard/leaderboard.service';

@Injectable()
export class GameProgressService {
  constructor(
    @InjectRepository(GameProgress)
    private progressRepository: Repository<GameProgress>,
    private leaderboardService: LeaderboardService,
  ) {}

  async create(
    userId: string,
    levelId: string,
    status: string,
    score: number,
  ): Promise<GameProgress> {
    const progress = this.progressRepository.create({
      user: { id: userId }, // Map to user relation
      levelId,
      status,
      score,
    });
    const savedProgress = await this.progressRepository.save(progress);

    if (status === 'completed') {
      // Update scores (handles best score logic and global accumulation)
      await this.leaderboardService.updateScores(userId, levelId, score);
    }

    return savedProgress;
  }

  async findByUser(userId: string): Promise<GameProgress[]> {
    return this.progressRepository.find({
      where: { userId },
      order: { completedAt: 'DESC' },
    });
  }

  async getUnlockedLevels(userId: string): Promise<string[]> {
    const completed = await this.progressRepository.find({
      where: { userId, status: 'completed' },
      select: ['levelId'],
    });
    // Logic to determine next unlocked level could be here, or just return completed ones
    // For now, return unique completed level IDs
    const completedIds = [...new Set(completed.map((p) => p.levelId))];
    // Assuming level-1 is always unlocked, and completing level-N unlocks level-(N+1)
    // This logic might be better placed in a higher level service or just return completed list
    return completedIds;
  }
}
