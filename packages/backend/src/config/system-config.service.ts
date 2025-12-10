import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
  ) {}

  async onModuleInit() {
    await this.ensureConfigExists();
  }

  private async ensureConfigExists() {
    const count = await this.configRepository.count();
    if (count === 0) {
      const config = this.configRepository.create();
      await this.configRepository.save(config);
    }
  }

  async getConfig(): Promise<SystemConfig> {
    const config = await this.configRepository.find();
    return config[0];
  }

  async updateConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
    const config = await this.getConfig();
    Object.assign(config, data);
    return this.configRepository.save(config);
  }
}
