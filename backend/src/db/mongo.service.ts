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
    const uri = this.config.get<string>('MONGODB_URI') || 'mongodb+srv://Meet_Mori:Meet%4099099@cluster0.zljbnwf.mongodb.net/english_coach?retryWrites=true&w=majority';
    const dbName = this.config.get<string>('MONGODB_DB') || 'english_coach';

    // Sanitize URI for logging to avoid leaking credentials
    const sanitizedUri = uri.replace(/:([^@/]+)@/, ':****@');
    console.log(`Connecting to MongoDB: ${sanitizedUri}`);

    this.client = new MongoClient(uri, {
      tls: true,
      family: 4, // Force IPv4 to avoid common issues on cloud platforms like Render
      serverSelectionTimeoutMS: 10000, 
      connectTimeoutMS: 10000,
    });

    try {
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log('MongoDB connection successful');

      await this.users().createIndex({ email: 1 }, { unique: true });
      await this.sessions().createIndex({ token: 1 }, { unique: true });
      await this.sessions().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      await this.activities().createIndex({ userId: 1, createdAt: -1 });
    } catch (error) {
      console.error('MongoDB connection error:', error.message);
      // In production, we want to fail fast if DB connection fails
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
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
