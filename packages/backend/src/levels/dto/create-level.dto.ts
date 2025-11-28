import { IsString, IsObject, IsNumber } from 'class-validator';

export class CreateLevelDto {
  @IsString()
  levelId!: string;

  @IsObject()
  data!: Record<string, any>;

  @IsNumber()
  difficulty!: number;
}
