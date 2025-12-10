import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig } from './system-config.entity';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig])],
  providers: [SystemConfigService],
  controllers: [SystemConfigController],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
