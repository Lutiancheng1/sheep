import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' })
  adVideoUrl: string;

  @Column({ default: 30 })
  adDurationSeconds: number;

  @Column({ default: 1 })
  dailyReviveLimit: number;

  @Column({ default: 0 }) // 0 = Midnight
  dailyResetHour: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
