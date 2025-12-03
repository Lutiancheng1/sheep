import { Controller, Post, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtService } from '@nestjs/jwt';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(
    private adminService: AdminService,
    private jwtService: JwtService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto) {
    console.log(`[AdminAuth] 登录尝试 - username: ${loginDto.username}`);

    const admin = await this.adminService.validateAdmin(loginDto.username, loginDto.password);

    const payload = {
      sub: admin.id,
      username: admin.username,
      role: 'admin',
    };

    const access_token = this.jwtService.sign(payload);

    console.log(`[AdminAuth] 登录成功 - adminId: ${admin.id}`);

    return {
      access_token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    };
  }
}
