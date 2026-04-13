import { ConfigService } from '@nestjs/config';
import { MongoService } from './mongo.service';

jest.mock('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => {
    const mockUsersCollection = { createIndex: jest.fn() };
    const mockActivitiesCollection = { createIndex: jest.fn() };
    const mockDb = {
      collection: jest.fn((name: string) => {
        if (name === 'users') {
          return mockUsersCollection;
        }
        return mockActivitiesCollection;
      }),
    };
    return {
      connect: jest.fn(),
      db: jest.fn(() => mockDb),
      close: jest.fn(),
    };
  }),
}));

const mockedMongo = jest.requireMock('mongodb') as {
  MongoClient: jest.Mock;
};

describe('MongoService', () => {
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;

  let service: MongoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MongoService(configService);
  });

  it('connects and prepares indexes during initialization', async () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'MONGODB_URI') return 'mongodb://user:pass@localhost:27017/app';
      if (key === 'MONGODB_DB') return 'app';
      return undefined;
    });
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await service.onModuleInit();

    const mockClient = mockedMongo.MongoClient.mock.results[0]?.value;
    expect(mockedMongo.MongoClient).toHaveBeenCalledWith('mongodb://user:pass@localhost:27017/app', expect.objectContaining({ tls: true }));
    expect(mockClient.connect).toHaveBeenCalled();
    expect(mockClient.db).toHaveBeenCalledWith('app');
    expect(mockClient.db().collection).toHaveBeenCalledWith('users');
    expect(mockClient.db().collection).toHaveBeenCalledWith('activities');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('mongodb://user:****@localhost:27017/app'));

    logSpy.mockRestore();
  });

  it('returns the configured collections', () => {
    const mockDb = {
      collection: jest.fn((name: string) => ({ name })),
    };
    (service as any).db = mockDb;

    expect(service.users()).toEqual({ name: 'users' });
    expect(service.activities()).toEqual({ name: 'activities' });
    expect(mockDb.collection).toHaveBeenNthCalledWith(1, 'users');
    expect(mockDb.collection).toHaveBeenNthCalledWith(2, 'activities');
  });

  it('closes the client on destroy', async () => {
    const close = jest.fn();
    (service as any).client = { close };

    await service.onModuleDestroy();

    expect(close).toHaveBeenCalled();
  });
});