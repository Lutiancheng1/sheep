import { IsObject, IsString, IsOptional } from 'class-validator';
import type { LevelData } from '../interfaces/level-data.interface';

export class CreateLevelDto {
  @IsString()
  @IsOptional()
  levelName?: string; // 可选的关卡名称

  @IsObject()
  data!: LevelData;
}
