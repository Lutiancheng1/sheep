import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { UserRequest } from '../auth/interfaces/user-request.interface';
import { UseItemDto } from './dto/use-item.dto';
import { ItemStatusDto } from './dto/item-status.dto';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Request() req: UserRequest): Promise<ItemStatusDto> {
    const status = await this.itemsService.getItemStatus(req.user.id);
    return {
      inventory: status.inventory,
      dailyReviveUsage: status.usage.revive,
      dailyReviveLimit: status.limits.revive,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('use')
  async useItem(
    @Request() req: UserRequest,
    @Body() body: UseItemDto,
  ): Promise<{ success: boolean; remaining: number }> {
    const result = await this.itemsService.useItem(req.user.id, body.type);
    if (!result.success) {
      throw new Error(result.message);
    }
    return { success: true, remaining: result.remaining! };
  }
}
