import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '用户ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'player1', description: '用户名' })
  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  passwordHash: string;

  @ApiProperty({ example: false, description: '是否为游客' })
  @Column({ default: false })
  isGuest: boolean;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '注册时间' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ example: 0, description: '今日复活次数' })
  @Column({ default: 0 })
  dailyReviveUsage: number;

  @ApiProperty({ example: { remove: 2, undo: 2, shuffle: 2 }, description: '道具库存' })
  @Column({ type: 'simple-json', default: JSON.stringify({ remove: 2, undo: 2, shuffle: 2 }) })
  itemInventory: { remove: number; undo: number; shuffle: number };

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '上次道具重置时间' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastItemResetDate: Date;

  @ApiProperty({ example: 3600, description: '总游戏时长(秒)' })
  @Column({ default: 0 })
  totalPlaytimeSeconds: number;
}
