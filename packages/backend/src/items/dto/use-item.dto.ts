import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UseItemDto {
  @ApiProperty({
    example: 'remove',
    description: '道具类型 (remove/undo/shuffle)',
    enum: ['remove', 'undo', 'shuffle'],
  })
  @IsEnum(['remove', 'undo', 'shuffle'])
  type!: 'remove' | 'undo' | 'shuffle';
}
