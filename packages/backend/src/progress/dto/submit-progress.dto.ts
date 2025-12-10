import { IsString, IsNumber, IsIn } from 'class-validator';

export class SubmitProgressDto {
  @IsString({ message: 'levelUuid必须是字符串' })
  levelUuid!: string;

  @IsString({ message: '状态必须是字符串' })
  @IsIn(['completed', 'failed'], { message: '状态必须是 completed 或 failed' })
  status!: string;

  @IsNumber({}, { message: '分数必须是数字' })
  score!: number;
}
