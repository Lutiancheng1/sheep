import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AdminSeeder } from './admin/admin.seeder';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // CORS 配置 - 开发环境允许所有来源,生产环境动态验证(允许同IP不同端口)
  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
          // 生产环境: 允许来自相同服务器的端口 4000(前端), 4001(后端), 4002(管理后台)
          if (!origin) {
            // 允许非浏览器请求(如服务端渲染、curl等)
            callback(null, true);
            return;
          }
          const allowedPorts = [':4000', ':4001', ':4002'];
          const isAllowed = allowedPorts.some((port) => origin.includes(port));
          callback(null, isAllowed);
        }
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
