import { IsObject, IsString, IsOptional } from 'class-validator';
import type { LevelData } from '../interfaces/level-data.interface';

export class CreateLevelDto {
  @IsString({ message: '关卡名称必须是字符串' })
  @IsOptional()
  levelName?: string; // 可选的关卡名称

  @IsObject({ message: '关卡数据必须是对象' })
  data!: LevelData;
}
