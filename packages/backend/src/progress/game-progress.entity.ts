import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../users/user.entity';
import { Level } from '../levels/level.entity';

@Entity()
export class GameProgress {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '进度ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '用户ID' })
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '关卡UUID' })
  @Column()
  levelUuid: string; // 使用 UUID 而非 levelId

  @ManyToOne(() => Level)
  @JoinColumn({ name: 'levelUuid' })
  level: Level;

  @ApiProperty({ example: 'completed', description: '游戏状态 (completed/failed)' })
  @Column()
  status: string; // 'completed', 'failed'

  @ApiProperty({ example: 100, description: '得分' })
  @Column({ default: 0 })
  score: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '完成时间' })
  @CreateDateColumn()
  completedAt: Date;
}
