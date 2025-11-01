import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs } from '../config/envs';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: envs.natsServiceName,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
          maxPacketSize: 10 * 1024 * 1024,
        },
      },
    ]),
  ],
  exports: [
    ClientsModule.register([
      {
        name: envs.natsServiceName,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
          maxPacketSize: 10 * 1024 * 1024,
        },
      },
    ]),
  ],
})
export class NatsModule {}
