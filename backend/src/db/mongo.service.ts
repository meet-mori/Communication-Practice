import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface SessionDoc {
  _id?: ObjectId;
  userId: ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface ActivityDoc {
  _id?: ObjectId;
  userId: ObjectId;
  score: number;
  label: string;
  mode: 'text' | 'audio';
  inputTextSnippet: string;
  transcription?: string | null;
  topicSuggestion?: string | null;
  createdAt: Date;
}

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private db: Db;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const uri = this.config.get<string>('MONGODB_URI') || 'mongodb+srv://Meet_Mori:Meet%4099099@cluster0.zljbnwf.mongodb.net/english_coach';
    const dbName = this.config.get<string>('MONGODB_DB') || 'english_coach';

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(dbName);

    await this.users().createIndex({ email: 1 }, { unique: true });
    await this.sessions().createIndex({ token: 1 }, { unique: true });
    await this.sessions().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await this.activities().createIndex({ userId: 1, createdAt: -1 });
  }

  async onModuleDestroy() {
    if (this.client) await this.client.close();
  }

  users(): Collection<UserDoc> {
    return this.db.collection<UserDoc>('users');
  }

  sessions(): Collection<SessionDoc> {
    return this.db.collection<SessionDoc>('sessions');
  }

  activities(): Collection<ActivityDoc> {
    return this.db.collection<ActivityDoc>('activities');
  }
}
