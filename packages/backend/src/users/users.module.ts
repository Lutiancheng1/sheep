import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { AdminModule } from '../admin/admin.module';
import { GameProgress } from '../progress/game-progress.entity';
import { UserLog } from '../user-logs/user-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, GameProgress, UserLog]),
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
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
