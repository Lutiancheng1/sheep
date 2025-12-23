import { ApiProperty } from '@nestjs/swagger';

export class LogEntryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '日志ID' })
  id!: string;

  @ApiProperty({ example: 'LEVEL_START', description: '行为类型' })
  action!: string;

  @ApiProperty({ example: { levelId: 1 }, description: '详细信息' })
  details!: Record<string, any>;

  @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: '创建时间' })
  createdAt!: Date;
}

export class LogListResponseDto {
  @ApiProperty({ type: [LogEntryDto], description: '日志列表' })
  items!: LogEntryDto[];

  @ApiProperty({ example: 100, description: '总记录数' })
  total!: number;
}
