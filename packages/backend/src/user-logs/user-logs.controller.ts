import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { UserLogsService } from './user-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { LogEventDto } from './dto/log-event.dto';
import { LogListResponseDto } from './dto/log-list-response.dto';

@Controller('logs')
export class UserLogsController {
  constructor(private readonly logsService: UserLogsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('event')
  async logEvent(
    @Request() req: { user: { id: string } },
    @Body() body: LogEventDto,
  ): Promise<{ success: boolean }> {
    if (body.action === 'HEARTBEAT') {
      const duration = Number(body.details?.duration) || 60; // Default 60s if not specified
      await this.logsService.handleHeartbeat(req.user.id, duration);
      return { success: true };
    }

    await this.logsService.logAction(req.user.id, body.action, body.details);
    return { success: true };
  }

  // 管理后台专用端点 - 需要管理员认证
  @UseGuards(AdminGuard)
  @Get()
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ): Promise<LogListResponseDto> {
    console.log(
      `[UserLogs] GET /logs 请求 - userId: ${userId || '全部'}, action: ${action || '全部'}, limit: ${limit}`,
    );
    const result = await this.logsService.getLogs(userId, action, limit, offset);
    console.log(`[UserLogs] 返回 ${result.items.length} 条日志记录,总计: ${result.total}`);

    return {
      total: result.total,
      items: result.items.map((item) => ({
        id: item.id,
        action: item.action,
        details: item.details || {},
        createdAt: item.createdAt,
      })),
    };
  }
}
