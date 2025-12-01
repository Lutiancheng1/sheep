import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { User } from '../users/user.entity';
import { UserLogsModule } from '../user-logs/user-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), UserLogsModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
