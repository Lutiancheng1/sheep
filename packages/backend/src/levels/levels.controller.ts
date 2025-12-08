import { Controller, Get, Param, Post, Body, Patch, Query, Delete } from '@nestjs/common';
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

  // 更新关卡(支持更新sortOrder等字段)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<CreateLevelDto & { sortOrder: number }>,
  ) {
    return await this.levelsService.updateLevel(id, updates);
  }

  @Patch(':id/toggle-publish')
  async togglePublish(@Param('id') id: string) {
    return this.levelsService.togglePublish(id);
  }

  // 批量发布/下架
  @Patch('batch/publish')
  async batchPublish(@Body() dto: { levelIds: string[]; status: 'published' | 'draft' }) {
    return this.levelsService.batchUpdateStatus(dto.levelIds, dto.status);
  }

  // 删除关卡
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.levelsService.delete(id);
  }

  // 批量删除
  @Delete('batch/delete')
  async batchDelete(@Body() dto: { levelIds: string[] }) {
    return this.levelsService.batchDelete(dto.levelIds);
  }
}
