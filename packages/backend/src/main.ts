import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:4000', 'http://localhost:4002'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4001);
}
bootstrap().catch((err) => {
  console.error('Error during bootstrap:', err);
  process.exit(1);
});
