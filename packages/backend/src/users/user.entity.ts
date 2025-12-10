import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  passwordHash: string;

  @Column({ default: false })
  isGuest: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 0 })
  dailyReviveUsage: number;

  @Column({ type: 'simple-json', default: JSON.stringify({ remove: 2, undo: 2, shuffle: 2 }) })
  itemInventory: { remove: number; undo: number; shuffle: number };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastItemResetDate: Date;

  @Column({ default: 0 })
  totalPlaytimeSeconds: number;
}
