import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for localhost:8081
  app.enableCors({
    origin: 'http://localhost:8081', // Allow requests from this origin
    credentials: true, // Enable sending cookies
  });

  app.use(cookieParser());

  await app.listen(3000);
}

bootstrap();
