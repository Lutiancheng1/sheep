import { ApiProperty } from '@nestjs/swagger';

export class ItemStatusDto {
  @ApiProperty({ example: { remove: 2, undo: 2, shuffle: 2 }, description: '道具库存' })
  inventory!: { remove: number; undo: number; shuffle: number };

  @ApiProperty({ example: 1, description: '今日已使用复活次数' })
  dailyReviveUsage!: number;

  @ApiProperty({ example: 3, description: '每日复活次数限制' })
  dailyReviveLimit!: number;
}
