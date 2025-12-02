import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './admin.entity';
import { AdminService } from './admin.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminGuard } from './admin.guard';
import { AdminSeeder } from './admin.seeder';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '24h' }, // 管理员 token 24小时有效期
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AdminAuthController],
  providers: [AdminService, AdminGuard, AdminSeeder],
  exports: [AdminService, AdminGuard, AdminSeeder],
})
export class AdminModule {}
