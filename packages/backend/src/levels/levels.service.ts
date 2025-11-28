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

  async findAll(): Promise<Level[]> {
    return this.levelsRepository.find({ order: { levelId: 'ASC' } });
  }

  async findOne(levelId: string): Promise<Level | null> {
    return this.levelsRepository.findOne({ where: { levelId } });
  }

  async create(
    levelId: string,
    data: Record<string, any>,
    difficulty: number,
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
}
