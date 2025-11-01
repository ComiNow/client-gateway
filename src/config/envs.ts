import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
   PORT: number;
   NATS_SERVICE_NAME: string;
   NATS_SERVERS: [string];
}

const envVarsSchema = joi.object({
   PORT: joi.number().required(),
   NATS_SERVICE_NAME: joi.string().required(),
   NATS_SERVERS: joi.array().items(joi.string()).required()
}).unknown(true);


const { error, value } = envVarsSchema.validate({
   ...process.env,
   NATS_SERVERS: process.env.NATS_SERVERS?.split(',')
});

if (error) {
   throw new Error(`Config validation error: ${error.message}`);
}

const envVars: EnvVars = value;

export const envs = {
   port: envVars.PORT,
   natsServiceName: envVars.NATS_SERVICE_NAME,
   natsServers: envVars.NATS_SERVERS
}

