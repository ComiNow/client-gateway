jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

describe('envs config', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('should export envs with valid environment variables', () => {
    process.env.PORT = '3000';
    process.env.NATS_SERVERS = 'nats://localhost:4222';
    process.env.NATS_SERVICE_NAME = 'TEST_SERVICE'; 

    const { envs } = require('./envs');

    expect(envs.port).toBe(3000);
    expect(envs.natsServers).toEqual(['nats://localhost:4222']);
    expect(envs.natsServiceName).toBe('TEST_SERVICE');
  });

  it('should throw error if required env vars are missing', () => {
    delete process.env.PORT;
    delete process.env.NATS_SERVERS;
    delete process.env.NATS_SERVICE_NAME;

    expect(() => {
      require('./envs');
    }).toThrow(/Config validation error/);
  });
});