import { HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ObjectId } from 'mongodb';
import { scryptSync } from 'crypto';
import { AuthService } from './auth.service';

function buildPasswordHash(password: string, salt = '0123456789abcdef0123456789abcdef') {
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}

describe('AuthService', () => {
  const usersCollection = {
    findOne: jest.fn(),
    insertOne: jest.fn(),
  };
  const mongoService = {
    users: jest.fn(() => usersCollection),
  };
  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(mongoService as any, jwtService as unknown as JwtService);
  });

  it('registers a new user and returns a token', async () => {
    const userId = new ObjectId();
    usersCollection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        _id: userId,
        name: 'Ana',
        email: 'ana@example.com',
        passwordHash: buildPasswordHash('secret123'),
        createdAt: new Date(),
      });
    usersCollection.insertOne.mockResolvedValue({ insertedId: userId });
    jwtService.signAsync.mockResolvedValue('token-value');

    await expect(service.register('  Ana  ', ' ANA@example.com ', 'secret123')).resolves.toEqual({
      token: 'token-value',
      user: {
        id: userId.toHexString(),
        name: 'Ana',
        email: 'ana@example.com',
      },
    });

    expect(usersCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana',
        email: 'ana@example.com',
        createdAt: expect.any(Date),
      }),
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        sub: userId.toHexString(),
        email: 'ana@example.com',
        name: 'Ana',
      }),
    );
  });

  it('rejects duplicate registrations', async () => {
    usersCollection.findOne.mockResolvedValue({
      _id: new ObjectId(),
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: buildPasswordHash('secret123'),
      createdAt: new Date(),
    });

    await expect(service.register('Ana', 'ana@example.com', 'secret123')).rejects.toBeInstanceOf(HttpException);
  });

  it('logs a user in when the password matches', async () => {
    const userId = new ObjectId();
    usersCollection.findOne.mockResolvedValue({
      _id: userId,
      name: 'Ana',
      email: 'ana@example.com',
      passwordHash: buildPasswordHash('secret123'),
      createdAt: new Date(),
    });
    jwtService.signAsync.mockResolvedValue('login-token');

    await expect(service.login(' ANA@example.com ', 'secret123')).resolves.toEqual({
      token: 'login-token',
      user: {
        id: userId.toHexString(),
        name: 'Ana',
        email: 'ana@example.com',
      },
    });
  });

  it('returns null when a token cannot be resolved', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: '64b64b64b64b64b64b64b64b' });
    usersCollection.findOne.mockResolvedValue(null);

    await expect(service.getUserFromToken('token')).resolves.toBeNull();
  });

  it('throws unauthorized when the token is invalid', async () => { 
    jwtService.verifyAsync.mockResolvedValue({ sub: '64b64b64b64b64b64b64b64b' });
    usersCollection.findOne.mockResolvedValue(null);

    await expect(service.requireUser('token')).rejects.toBeInstanceOf(HttpException);
  });
});