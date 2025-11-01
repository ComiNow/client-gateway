import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('/')
export class HealthCheckController {
  @Get()
  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica el estado de salud del Client Gateway.',
  })
  @ApiOkResponse({
    description: 'Sistema funcionando correctamente',
    schema: {
      example: {
        status: 'OK',
        message: 'Client gateway is up and running!',
        timestamp: '2024-01-15T10:30:00Z',
        uptime: 7530,
        version: '2.0.0',
      },
    },
  })
  healthCheck() {
    return {
      status: 'OK',
      message: 'Client gateway is up and running!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
