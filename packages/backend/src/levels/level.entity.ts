import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import type { LevelData } from './interfaces/level-data.interface';

@Entity()
export class Level {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '关卡ID (UUID)' })
  @PrimaryGeneratedColumn('uuid')
  id: string; // 主键，UUID

  @ApiProperty({ example: '第一关', description: '关卡名称', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  levelName: string | null; // 关卡名称，如 "第一关"、"新手关卡"

  @ApiProperty({ example: { tiles: [], slots: 7 }, description: '关卡数据 (JSON)' })
  @Column('jsonb')
  data: LevelData; // Stores the JSON configuration of the level

  @ApiProperty({ example: 1, description: '排序权重 (越小越靠前)' })
  @Column({ default: 0, nullable: true })
  sortOrder: number; // 关卡排序字段,数字越小越靠前

  @ApiProperty({ example: 'published', description: '发布状态 (draft/published)' })
  @Column({ default: 'draft' })
  status: string; // 'draft' | 'published'

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '创建时间' })
  @CreateDateColumn()
  createdAt: Date;
}
