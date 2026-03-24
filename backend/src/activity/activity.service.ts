import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { AuthService } from '../auth/auth.service';
import { MongoService } from '../db/mongo.service';

export interface CreateActivityBody {
  score: number;
  mode: 'text' | 'audio';
  inputText?: string;
  transcription?: string | null;
  topicSuggestion?: string | null;
}

@Injectable()
export class ActivityService {
  constructor(
    private auth: AuthService,
    private mongo: MongoService,
  ) {}

  private getLabel(score: number): string {
    if (score >= 9) return 'Excellent';
    if (score >= 7) return 'Good';
    if (score >= 5) return 'Fair';
    return 'Needs Work';
  }

  async create(token: string, body: CreateActivityBody) {
    const user = await this.auth.requireUser(token);
    const score = Number(body.score);
    if (Number.isNaN(score) || score < 0 || score > 10) {
      throw new HttpException('Invalid score', HttpStatus.BAD_REQUEST);
    }
    const mode: 'text' | 'audio' = body.mode === 'audio' ? 'audio' : 'text';
    const input = (body.inputText || '').trim();
    const snippet = input ? input.slice(0, 240) : 'Audio session';

    await this.mongo.activities().insertOne({
      userId: new ObjectId(user.id),
      score,
      label: this.getLabel(score),
      mode,
      inputTextSnippet: snippet,
      transcription: body.transcription || null,
      topicSuggestion: body.topicSuggestion || null,
      createdAt: new Date(),
    });

    return { ok: true };
  }

  async myHistory(token: string, page = 1, limit = 20) {
    const user = await this.auth.requireUser(token);
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 5000);
    const query = { userId: new ObjectId(user.id) };
    const total = await this.mongo.activities().countDocuments(query);
    const totalPages = Math.max(Math.ceil(total / safeLimit), 1);
    const skip = (safePage - 1) * safeLimit;
    const rows = await this.mongo.activities()
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .toArray();

    return {
      user,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
      },
      items: rows.map(row => ({
        id: row._id?.toString(),
        score: row.score,
        label: row.label,
        mode: row.mode,
        inputTextSnippet: row.inputTextSnippet,
        topicSuggestion: row.topicSuggestion || null,
        createdAt: row.createdAt,
      })),
    };
  }
}
