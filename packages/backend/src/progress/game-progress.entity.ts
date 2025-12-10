import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Level } from '../levels/level.entity';

@Entity()
export class GameProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  levelUuid: string; // 使用 UUID 而非 levelId

  @ManyToOne(() => Level)
  @JoinColumn({ name: 'levelUuid' })
  level: Level;

  @Column()
  status: string; // 'completed', 'failed'

  @Column({ default: 0 })
  score: number;

  @CreateDateColumn()
  completedAt: Date;
}
