import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserLog } from './user-log.entity';
import { UserLogsService } from './user-logs.service';
import { UserLogsController } from './user-logs.controller';
import { User } from '../users/user.entity';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLog, User]),
    AdminModule,
    // AdminGuard 需要 JwtService 和 ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UserLogsService],
  controllers: [UserLogsController],
  exports: [UserLogsService],
})
export class UserLogsModule {}
