import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import type { UserLogDetails } from './interfaces/user-log-details.interface';

@Entity()
export class UserLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  action: string; // e.g., 'LOGIN', 'LEVEL_START', 'ITEM_USE', 'HEARTBEAT'

  @Column({ type: 'simple-json', nullable: true })
  details: UserLogDetails | null;

  @CreateDateColumn()
  createdAt: Date;
}
