import { IsString, IsObject, IsNumber } from 'class-validator';
import type { LevelData } from '../interfaces/level-data.interface';

export class CreateLevelDto {
  @IsString()
  levelId!: string;

  @IsObject()
  data!: LevelData;

  @IsNumber()
  difficulty!: number;
}
