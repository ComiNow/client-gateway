import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RpcCustomExceptionFilter } from './common';
import { envs } from './config/envs';
import { AuthGuard } from './auth/guards/auth.guard';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('Main-Gateway');

  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });

  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'https://z2j7v360-4200.use.devtunnels.ms',
      'https://s05phrls-4201.use.devtunnels.ms',
      'https://d3gwsdg49ynx4o.cloudfront.net', // AppServiceClient - Producción
      'https://d2wez1qp46w24p.cloudfront.net', // AppServiceEmployee - Producción
    ],
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new RpcCustomExceptionFilter());

  const authGuard = app.get(AuthGuard);
  app.useGlobalGuards(authGuard);

  const config = new DocumentBuilder()
    .setTitle('CoffeeNow - Client Gateway API')
    .setDescription(
      'API Gateway para el sistema CoffeeNow que enruta peticiones HTTP hacia microservicios mediante NATS.',
    )
    .setVersion('2.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Token JWT para autenticación',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticación y autorización')
    .addTag('Products', 'Gestión de productos')
    .addTag('Categories', 'Gestión de categorías')
    .addTag('Orders', 'Gestión de pedidos')
    .addTag('Tables', 'Gestión de mesas')
    .addTag('Files', 'Subida de archivos')
    .addTag('Health', 'Estado del sistema')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    customSiteTitle: 'CoffeeNow API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  await app.listen(envs.port);

  logger.log(`Server running on http://localhost:${envs.port}`);
  logger.log(`API Documentation: http://localhost:${envs.port}/docs`);
}
bootstrap();
