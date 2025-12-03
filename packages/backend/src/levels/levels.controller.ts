import { Controller, Get, Param, Post, Body, Patch, Query } from '@nestjs/common';
import { LevelsService } from './levels.service';

import { CreateLevelDto } from './dto/create-level.dto';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  async findAll(@Query('includeAll') includeAll?: string) {
    return this.levelsService.findAll(includeAll === 'true');
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

  @Patch(':id/toggle-publish')
  async togglePublish(@Param('id') id: string) {
    return this.levelsService.togglePublish(id);
  }
}
