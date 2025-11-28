import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';
import { Level } from './level.entity';

import { LevelSeederService } from './level-seeder.service';

@Module({
  imports: [TypeOrmModule.forFeature([Level])],
  providers: [LevelsService, LevelSeederService],
  controllers: [LevelsController],
  exports: [LevelsService],
})
export class LevelsModule {}
