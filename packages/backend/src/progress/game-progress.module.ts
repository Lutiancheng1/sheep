import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameProgressService } from './game-progress.service';
import { GameProgressController } from './game-progress.controller';
import { GameProgress } from './game-progress.entity';

import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameProgress]), LeaderboardModule],
  providers: [GameProgressService],
  controllers: [GameProgressController],
  exports: [GameProgressService],
})
export class GameProgressModule {}
