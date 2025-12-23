import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class SystemConfig {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '配置ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'https://example.com/ad.mp4', description: '广告视频URL' })
  @Column({ default: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' })
  adVideoUrl: string;

  @ApiProperty({ example: 30, description: '广告时长(秒)' })
  @Column({ default: 30 })
  adDurationSeconds: number;

  @ApiProperty({ example: 1, description: '每日复活次数限制' })
  @Column({ default: 1 })
  dailyReviveLimit: number;

  @ApiProperty({ example: 0, description: '每日重置时间(小时)' })
  @Column({ default: 0 }) // 0 = Midnight
  dailyResetHour: number;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '更新时间' })
  @UpdateDateColumn()
  updatedAt: Date;
}
