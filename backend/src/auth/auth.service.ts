import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ObjectId } from 'mongodb';
import { MongoService, UserDoc } from '../db/mongo.service';

@Injectable()
export class AuthService {
  constructor(private mongo: MongoService) {}

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [salt, savedHash] = stored.split(':');
    const hash = scryptSync(password, salt, 64);
    const saved = Buffer.from(savedHash, 'hex');
    return saved.length === hash.length && timingSafeEqual(saved, hash);
  }

  private toSafeUser(user: UserDoc & { _id: ObjectId }) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };
  }

  private async createSession(userId: ObjectId): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await this.mongo.sessions().insertOne({
      userId,
      token,
      createdAt: now,
      expiresAt,
    });
    return token;
  }

  async register(name: string, email: string, password: string) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanName || !cleanEmail || !password) {
      throw new HttpException('Name, email and password are required', HttpStatus.BAD_REQUEST);
    }
    if (password.length < 6) {
      throw new HttpException('Password must be at least 6 characters', HttpStatus.BAD_REQUEST);
    }

    const existing = await this.mongo.users().findOne({ email: cleanEmail });
    if (existing) {
      throw new HttpException('Email already registered', HttpStatus.CONFLICT);
    }

    const result = await this.mongo.users().insertOne({
      name: cleanName,
      email: cleanEmail,
      passwordHash: this.hashPassword(password),
      createdAt: new Date(),
    });

    const user = await this.mongo.users().findOne({ _id: result.insertedId });
    const token = await this.createSession(result.insertedId);
    return { token, user: this.toSafeUser(user as UserDoc & { _id: ObjectId }) };
  }

  async login(email: string, password: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await this.mongo.users().findOne({ email: cleanEmail });
    if (!user) {
      throw new HttpException('User not registered. Please register first.', HttpStatus.UNAUTHORIZED);
    }

    if (!this.verifyPassword(password || '', user.passwordHash)) {
      throw new HttpException('Invalid email or password', HttpStatus.UNAUTHORIZED);
    }
    const token = await this.createSession(user._id as ObjectId);
    return { token, user: this.toSafeUser(user as UserDoc & { _id: ObjectId }) };
  }

  async getUserFromToken(token: string) {
    if (!token) return null;
    const session = await this.mongo.sessions().findOne({ token });
    if (!session || session.expiresAt < new Date()) return null;
    const user = await this.mongo.users().findOne({ _id: session.userId });
    if (!user) {
      await this.mongo.sessions().deleteOne({ _id: session._id });
      return null;
    }
    return this.toSafeUser(user as UserDoc & { _id: ObjectId });
  }

  async requireUser(token: string) {
    const user = await this.getUserFromToken(token);
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
