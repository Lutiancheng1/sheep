import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserLog } from './user-log.entity';
import { UserLogsService } from './user-logs.service';
import { UserLogsController } from './user-logs.controller';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserLog, User])],
  providers: [UserLogsService],
  controllers: [UserLogsController],
  exports: [UserLogsService],
})
export class UserLogsModule {}
