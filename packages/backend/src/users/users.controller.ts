import {
  Controller,
  Get,
  Param,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Basic endpoints for testing, AuthController will handle login/register
  @Get(':username')
  async findOne(@Param('username') username: string) {
    return this.usersService.findOne(username);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  // 删除用户 - 需要管理员权限
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: '用户删除成功', deletedUserId: id };
  }

  // 游客清理功能 - 需要管理员权限
  @Get('cleanup/preview')
  @UseGuards(AdminGuard)
  async getCleanupPreview() {
    const uselessGuests = await this.usersService.findUselessGuests();
    const count = uselessGuests.length;
    // 估算每个用户约占用 5KB
    const estimatedSpaceKB = count * 5;
    const estimatedSpaceFreed =
      estimatedSpaceKB > 1024
        ? `约 ${(estimatedSpaceKB / 1024).toFixed(2)} MB`
        : `约 ${estimatedSpaceKB} KB`;

    return {
      users: uselessGuests.map((u) => ({
        id: u.id,
        username: u.username,
        createdAt: u.createdAt,
        totalPlaytimeSeconds: u.totalPlaytimeSeconds,
      })),
      count,
      estimatedSpaceFreed,
    };
  }

  @Post('cleanup')
  @UseGuards(AdminGuard)
  async executeCleanup() {
    const result = await this.usersService.cleanupGuests();
    // 估算释放空间
    const estimatedSpaceKB = result.deletedCount * 5;
    const freedSpace =
      estimatedSpaceKB > 1024
        ? `约 ${(estimatedSpaceKB / 1024).toFixed(2)} MB`
        : `约 ${estimatedSpaceKB} KB`;

    return {
      ...result,
      freedSpace,
    };
  }
}
