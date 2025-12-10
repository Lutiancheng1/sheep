import { Controller, Get, Put, Body } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemConfig } from './system-config.entity';

@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get()
  async getConfig(): Promise<SystemConfig> {
    return this.configService.getConfig();
  }

  @Put()
  async updateConfig(@Body() data: Partial<SystemConfig>): Promise<SystemConfig> {
    return this.configService.updateConfig(data);
  }
}
