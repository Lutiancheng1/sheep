import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './level.entity';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private levelsRepository: Repository<Level>,
  ) {}

  async findAll(includeAll = false): Promise<Level[]> {
    // 前端只看到已发布的关卡，管理后台可以看到所有关卡
    const where = includeAll ? {} : { status: 'published' };
    return this.levelsRepository.find({ where, order: { levelId: 'ASC' } });
  }

  async findOne(levelId: string): Promise<Level | null> {
    return this.levelsRepository.findOne({ where: { levelId } });
  }

  async create(
    levelId: string,
    data: Record<string, any>,
    difficulty: number,
    status: 'draft' | 'published' = 'draft',
  ): Promise<Level> {
    try {
      let existing = await this.levelsRepository.findOne({
        where: { levelId },
      });

      if (!existing) {
        try {
          const level = this.levelsRepository.create({
            levelId,
            data,
            difficulty,
            status,
          });
          return await this.levelsRepository.save(level);
        } catch (err: unknown) {
          if (
            typeof err === 'object' &&
            err !== null &&
            'code' in err &&
            (err as { code: string }).code === '23505'
          ) {
            // Postgres duplicate key error code
            existing = await this.levelsRepository.findOne({
              where: { levelId },
            });
          } else {
            throw err;
          }
        }
      }

      if (existing) {
        existing.data = data;
        existing.difficulty = difficulty;
        return await this.levelsRepository.save(existing);
      }

      throw new Error('Could not create or update level');
    } catch (error) {
      console.error('Error creating/updating level:', error);
      throw error;
    }
  }

  async togglePublish(levelId: string): Promise<Level> {
    const level = await this.levelsRepository.findOne({ where: { levelId } });
    if (!level) {
      throw new Error('Level not found');
    }
    level.status = level.status === 'published' ? 'draft' : 'published';
    return await this.levelsRepository.save(level);
  }

  // 批量更新状态
  async batchUpdateStatus(
    levelIds: string[],
    status: 'published' | 'draft',
  ): Promise<{ success: boolean; updated: number }> {
    const levels = await this.levelsRepository.find({
      where: levelIds.map((levelId) => ({ levelId })),
    });
    levels.forEach((level) => {
      level.status = status;
    });
    await this.levelsRepository.save(levels);
    return { success: true, updated: levels.length };
  }

  // 删除关卡
  async delete(levelId: string): Promise<{ success: boolean }> {
    const level = await this.findOne(levelId);
    if (!level) {
      throw new Error('Level not found');
    }
    await this.levelsRepository.remove(level);
    return { success: true };
  }

  // 批量删除
  async batchDelete(levelIds: string[]): Promise<{ success: boolean; deleted: number }> {
    const levels = await this.levelsRepository.find({
      where: levelIds.map((levelId) => ({ levelId })),
    });
    await this.levelsRepository.remove(levels);
    return { success: true, deleted: levels.length };
  }
}
