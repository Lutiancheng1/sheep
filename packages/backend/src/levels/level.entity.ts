import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import type { LevelData } from './interfaces/level-data.interface';

@Entity()
export class Level {
  @PrimaryGeneratedColumn('uuid')
  id: string; // 主键，UUID

  @Column({ type: 'varchar', nullable: true })
  levelName: string | null; // 关卡名称，如 "第一关"、"新手关卡"

  @Column('jsonb')
  data: LevelData; // Stores the JSON configuration of the level

  @Column({ default: 0, nullable: true })
  sortOrder: number; // 关卡排序字段,数字越小越靠前

  @Column({ default: 'draft' })
  status: string; // 'draft' | 'published'

  @CreateDateColumn()
  createdAt: Date;
}
