import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

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

  @Column({ default: 0, nullable: true })
  sortOrder: number; // 关卡排序字段,数字越小越靠前

  @Column({ default: 'draft' })
  status: string; // 'draft' | 'published'

  @CreateDateColumn()
  createdAt: Date;
}
