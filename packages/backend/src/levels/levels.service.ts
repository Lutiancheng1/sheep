import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from './level.entity';
import type { LevelData } from './interfaces/level-data.interface';

@Injectable()
export class LevelsService {
  constructor(
    @InjectRepository(Level)
    private levelsRepository: Repository<Level>,
  ) {}

  async findAll(excludeData = false): Promise<Level[]> {
    // Admin后台需要看到所有关卡（包括草稿）
    // 前端通过单独的API只获取已发布的关卡
    const selectFields: (keyof Level)[] | undefined = excludeData
      ? ['id', 'levelName', 'sortOrder', 'status', 'createdAt']
      : undefined;

    // 按sortOrder优先排序，返回所有关卡（不过滤status）
    return this.levelsRepository.find({
      select: selectFields,
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Level | null> {
    return this.levelsRepository.findOne({ where: { id } });
  }

  async findBySortOrder(sortOrder: number): Promise<Level | null> {
    return this.levelsRepository.findOne({ where: { sortOrder } });
  }

  async create(
    data: LevelData,
    levelName?: string,
    status: 'draft' | 'published' = 'draft',
    sortOrder?: number,
  ): Promise<Level> {
    const level = this.levelsRepository.create({
      levelName: levelName || null,
      data,
      status,
      sortOrder: sortOrder || 0,
    });
    return await this.levelsRepository.save(level);
  }

  async updateLevel(
    id: string,
    updates: Partial<{ data: LevelData; levelName: string; sortOrder: number; status: string }>,
  ): Promise<Level> {
    const level = await this.levelsRepository.findOne({ where: { id } });
    if (!level) {
      throw new Error('Level not found');
    }

    // 更新字段
    Object.assign(level, updates);

    return await this.levelsRepository.save(level);
  }

  async togglePublish(id: string): Promise<Level> {
    const level = await this.levelsRepository.findOne({ where: { id } });
    if (!level) {
      throw new Error('Level not found');
    }
    level.status = level.status === 'published' ? 'draft' : 'published';
    return await this.levelsRepository.save(level);
  }

  // 批量更新状态
  async batchUpdateStatus(
    ids: string[],
    status: 'published' | 'draft',
  ): Promise<{ success: boolean; updated: number }> {
    const levels = await this.levelsRepository.findByIds(ids);
    levels.forEach((level) => {
      level.status = status;
    });
    await this.levelsRepository.save(levels);
    return { success: true, updated: levels.length };
  }

  // 删除关卡
  async delete(id: string): Promise<{ success: boolean }> {
    const level = await this.findOne(id);
    if (!level) {
      throw new Error('Level not found');
    }
    await this.levelsRepository.remove(level);
    return { success: true };
  }

  // 批量删除
  async batchDelete(ids: string[]): Promise<{ success: boolean; deleted: number }> {
    const levels = await this.levelsRepository.findByIds(ids);
    await this.levelsRepository.remove(levels);
    return { success: true, deleted: levels.length };
  }
}
