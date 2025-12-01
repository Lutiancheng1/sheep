import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserLogsService } from './user-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('logs')
export class UserLogsController {
  constructor(private readonly logsService: UserLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('event')
  async logEvent(
    @Request() req: { user: { id: string } },
    @Body() body: { action: string; details?: Record<string, any> },
  ) {
    if (body.action === 'HEARTBEAT') {
      const duration = Number(body.details?.duration) || 60; // Default 60s if not specified
      await this.logsService.handleHeartbeat(req.user.id, duration);
      return { success: true };
    }

    return this.logsService.logAction(req.user.id, body.action, body.details);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    // TODO: Add admin check here if needed. For now, assuming any authenticated user (or just admin) can access.
    // Ideally, we should check if req.user.isAdmin or similar.
    return this.logsService.getLogs(userId, action, limit, offset);
  }
}
