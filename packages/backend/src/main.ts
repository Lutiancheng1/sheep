import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AdminSeeder } from './admin/admin.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS 配置 - 开发环境允许所有来源，生产环境限制具体域名
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? [
          'http://8.148.255.174:4000', // 生产环境前端
          'http://8.148.255.174:4001', // 生产环境后端
          'http://8.148.255.174:4002', // 生产环境管理后台
        ]
      : true; // 开发环境允许所有

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-API-Key'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 初始化默认管理员
  const adminSeeder = app.get(AdminSeeder);
  await adminSeeder.seed();

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  await app.listen(process.env.PORT ?? 4001);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
