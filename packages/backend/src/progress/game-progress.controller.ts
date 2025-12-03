import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { GameProgressService } from './game-progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubmitProgressDto } from './dto/submit-progress.dto';
import type { UserRequest } from '../types/express-request.interface';

@Controller('progress')
export class GameProgressController {
  constructor(private readonly progressService: GameProgressService) {}

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submitProgress(@Request() req: UserRequest, @Body() submitProgressDto: SubmitProgressDto) {
    return this.progressService.create(
      req.user.id,
      submitProgressDto.levelId,
      submitProgressDto.status,
      submitProgressDto.score,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  async getHistory(@Request() req: UserRequest) {
    return this.progressService.findByUser(req.user.id);
  }
}
