import { Controller, Get, Param, Inject, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { envs } from 'src/config/envs';
import { firstValueFrom } from 'rxjs';

@ApiBearerAuth('JWT-auth')
@ApiTags('Tables')
@Controller('tables')
export class TablesController {
  constructor(
    @Inject(envs.natsServiceName) private readonly client: ClientProxy,
  ) {}

  @Get(':businessId/:tableId')
  @ApiOperation({
    summary: 'Obtener mesa por ID',
    description:
      'Busca información de una mesa específica por su identificador.',
  })
  @ApiParam({
    name: 'businessId',
    description: 'ID del negocio (MongoDB ObjectId)',
    example: '68dde84e273d5c7953420e9d',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la mesa (UUID)',
    example: '9128352e-386c-46fd-beb4-78c6827de348',
  })
  @ApiOkResponse({
    description: 'Mesa encontrada',
    schema: {
      example: {
        id: '9128352e-386c-46fd-beb4-78c6827de348',
        number: 5,
        capacity: 4,
        status: 'AVAILABLE',
        location: 'Terraza',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token JWT requerido' })
  @ApiNotFoundResponse({ description: 'Mesa no encontrada' })
  async findOne(
    @Param('businessId') businessId: string,
    @Param('tableId') tableId: string,
  ) {
    try {
      const table = await firstValueFrom(
        this.client.send('findTableById', { id: tableId, businessId }),
      );
      return table;
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
