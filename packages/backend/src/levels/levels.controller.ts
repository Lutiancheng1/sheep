import { Controller, Get, Param, Post, Body, Patch, Query, Delete } from '@nestjs/common';
import { LevelsService } from './levels.service';
import { Level } from './level.entity';
import { CreateLevelDto } from './dto/create-level.dto';

@Controller('levels')
export class LevelsController {
  constructor(private readonly levelsService: LevelsService) {}

  @Get()
  async findAll(@Query('excludeData') excludeData?: string): Promise<Level[]> {
    return this.levelsService.findAll(excludeData === 'true');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Level | null> {
    return this.levelsService.findOne(id);
  }

  // Admin only in real app, but open for now to seed data
  @Post()
  async create(@Body() createLevelDto: CreateLevelDto): Promise<Level> {
    return this.levelsService.create(createLevelDto.data, createLevelDto.levelName);
  }

  // 更新关卡(支持更新sortOrder等字段)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<CreateLevelDto & { sortOrder: number }>,
  ): Promise<Level> {
    return await this.levelsService.updateLevel(id, updates);
  }

  @Patch(':id/toggle-publish')
  async togglePublish(@Param('id') id: string): Promise<Level> {
    return this.levelsService.togglePublish(id);
  }

  // 批量发布/下架
  @Patch('batch/publish')
  async batchPublish(
    @Body() dto: { ids: string[]; status: 'published' | 'draft' },
  ): Promise<{ success: boolean; updated: number }> {
    return this.levelsService.batchUpdateStatus(dto.ids, dto.status);
  }

  // 删除关卡
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.levelsService.delete(id);
  }

  // 批量删除
  @Delete('batch/delete')
  async batchDelete(
    @Body() dto: { ids: string[] },
  ): Promise<{ success: boolean; deleted: number }> {
    return this.levelsService.batchDelete(dto.ids);
  }
}
