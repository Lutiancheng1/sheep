import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class LogEventDto {
  @ApiProperty({ example: 'LEVEL_START', description: '行为类型' })
  @IsString()
  action!: string;

  @ApiProperty({ example: { levelId: 1 }, description: '详细信息', required: false })
  @IsOptional()
  @IsObject()
  details?: Record<string, any>;
}
