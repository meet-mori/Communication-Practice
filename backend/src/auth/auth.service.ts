import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { ObjectId } from 'mongodb';
import { MongoService, UserDoc } from '../db/mongo.service';

@Injectable()
export class AuthService {
  constructor(
    private mongo: MongoService,
    private jwtService: JwtService,
  ) {}

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

  private async createToken(user: UserDoc & { _id: ObjectId }): Promise<string> {
    return this.jwtService.signAsync({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });
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

    let result;
    try {
      result = await this.mongo.users().insertOne({
        name: cleanName,
        email: cleanEmail,
        passwordHash: this.hashPassword(password),
        createdAt: new Date(),
      });
    } catch (error: any) {
      // Handle race condition: duplicate email from concurrent registration
      if (error.code === 11000) {
        throw new HttpException('Email already registered', HttpStatus.CONFLICT);
      }
      throw error;
    }

    const user = await this.mongo.users().findOne({ _id: result.insertedId });
    if (!user) {
      throw new HttpException('Failed to retrieve created user', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const typedUser = user as UserDoc & { _id: ObjectId };
    const safeUser = this.toSafeUser(typedUser);
    const token = await this.createToken(typedUser);
    return { token, user: safeUser };
  }

  async login(email: string, password: string) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = await this.mongo.users().findOne({ email: cleanEmail });
    if (!user) {
      throw new HttpException('Invalid email or password!.', HttpStatus.UNAUTHORIZED);
    }

    if (!this.verifyPassword(password || '', user.passwordHash)) {
      throw new HttpException('Invalid email or password!', HttpStatus.UNAUTHORIZED);
    }
    const safeUser = this.toSafeUser(user as UserDoc & { _id: ObjectId });
    const token = await this.createToken(user as UserDoc & { _id: ObjectId });
    return { token, user: safeUser };
  }

  async getUserFromToken(token: string) {
    if (!token) return null;
    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);
      if (!payload?.sub) return null;

      const user = await this.mongo.users().findOne({ _id: new ObjectId(payload.sub) });
      if (!user) return null;

      return this.toSafeUser(user as UserDoc & { _id: ObjectId }); 
    } catch {
      return null;
    }
  }

  async requireUser(token: string) {
    const user = await this.getUserFromToken(token);
    if (!user) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
