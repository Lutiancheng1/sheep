import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardEntryDto {
  @ApiProperty({ example: 'player1', description: '用户名' })
  username!: string;

  @ApiProperty({ example: 100, description: '分数' })
  score!: number;

  @ApiProperty({ example: 1, description: '排名' })
  rank!: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: '用户ID' })
  userId!: string;
}
