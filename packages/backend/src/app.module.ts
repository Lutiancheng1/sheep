// 确保 crypto 在全局可用 (必须在所有imports之前)

import * as crypto from 'crypto';

if (typeof (globalThis as typeof globalThis & { crypto?: any }).crypto === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  (globalThis as any).crypto = (crypto as any).webcrypto || crypto;
}

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LevelsModule } from './levels/levels.module';
import { GameProgressModule } from './progress/game-progress.module';
import { ItemsModule } from './items/items.module';
import configuration from './config/configuration';

import { RedisModule } from '@nestjs-modules/ioredis';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { UserLogsModule } from './user-logs/user-logs.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        // entities: [User], // Auto-load is better
        autoLoadEntities: true,
        synchronize: true, // Auto-create tables (dev only)
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        url: `redis://${configService.get<string>('redis.host')}:${configService.get<number>('redis.port')}`,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    LevelsModule,
    GameProgressModule,
    LeaderboardModule,
    ItemsModule,
    UserLogsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
