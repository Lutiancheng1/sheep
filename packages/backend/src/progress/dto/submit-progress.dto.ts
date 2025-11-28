import { IsString, IsNumber, IsIn } from 'class-validator';

export class SubmitProgressDto {
  @IsString()
  levelId!: string;

  @IsString()
  @IsIn(['completed', 'failed'])
  status!: string;

  @IsNumber()
  score!: number;
}
