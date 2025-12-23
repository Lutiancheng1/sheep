import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import type { UserRequest } from '../types/express-request.interface';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req: UserRequest): Promise<LoginResponseDto> {
    console.log('AuthController.login called with user:', req.user);
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<LoginResponseDto> {
    return this.authService.register(registerDto.username, registerDto.password);
  }

  @Post('guest')
  async guestLogin(): Promise<LoginResponseDto> {
    return this.authService.guestLogin();
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@Request() req: UserRequest): Promise<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bind')
  async bind(
    @Request() req: UserRequest,
    @Body() registerDto: RegisterDto,
  ): Promise<LoginResponseDto> {
    return this.authService.bind(req.user.id, registerDto.username, registerDto.password);
  }
}
