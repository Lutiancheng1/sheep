import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ItemsService } from './items.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  async getStatus(@Request() req: any) {
    return this.itemsService.getItemStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('use')
  async useItem(@Request() req: any, @Body() body: { type: 'remove' | 'undo' | 'shuffle' }) {
    return this.itemsService.useItem(req.user.id, body.type);
  }
}
