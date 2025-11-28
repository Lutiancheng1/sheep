import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { LevelsService } from './levels.service';

import { CreateLevelDto } from './dto/create-level.dto';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  async findAll() {
    return this.levelsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.levelsService.findOne(id);
  }

  // Admin only in real app, but open for now to seed data
  @Post()
  async create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelsService.create(
      createLevelDto.levelId,
      createLevelDto.data,
      createLevelDto.difficulty,
    );
  }
}
