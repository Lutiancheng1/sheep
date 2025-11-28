import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Level {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  levelId: string; // e.g., 'level-1'

  @Column('jsonb')
  data: any; // Stores the JSON configuration of the level

  @Column({ default: 1 })
  difficulty: number;

  @CreateDateColumn()
  createdAt: Date;
}
