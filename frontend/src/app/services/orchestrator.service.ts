import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface GrammarResult {
  original: string;
  correctedText: string;
  mistakes: string[];
}

export interface VocabularyResult {
  enhancedText: string;
  suggestions: string[];
}

export interface CoachResult {
  score: number;
  summary: string;
  encouragement: string;
}

export interface DailyTopicResult {
  topic: string;
  reason: string;
  practicePrompt: string;
}

export interface PipelineResult {
  transcription?: string;
  step1_grammar: GrammarResult;
  step2_vocabulary: VocabularyResult;
  step3_coach: CoachResult;
  step4_daily_topic: DailyTopicResult;
}

// Shape of each SSE event from backend
export interface PipelineEvent {
  type:
  | 'transcribed'
  | 'grammar_start' | 'grammar_done'
  | 'vocabulary_start' | 'vocabulary_done'
  | 'coach_start' | 'coach_done'
  | 'daily_topic_start' | 'daily_topic_done'
  | 'complete' | 'error';
  data?: any;
  message?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ActivityItem {
  id: string;
  score: number;
  label: string;
  mode: 'text' | 'audio';
  inputTextSnippet: string;
  topicSuggestion: string | null;
  createdAt: string;
}

export interface ActivityPage {
  user: AuthUser;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  items: ActivityItem[];
}

@Injectable({ providedIn: 'root' })
export class OrchestratorService {
  private api = 'https://communication-practice-qdw2.onrender.com';

  constructor(private http: HttpClient, private zone: NgZone) { }

  private authHeaders(token: string) {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { email, password });
  }

  me(token: string): Observable<{ user: AuthUser }> {
    return this.http.get<{ user: AuthUser }>(`${this.api}/auth/me`, {
      headers: this.authHeaders(token),
    });
  }

  saveActivity(
    token: string,
    payload: {
      score: number;
      mode: 'text' | 'audio';
      inputText?: string;
      transcription?: string | null;
      topicSuggestion?: string | null;
    },
  ): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.api}/activity`, payload, {
      headers: this.authHeaders(token),
    });
  }

  myActivities(token: string, page = 1, limit = 20): Observable<ActivityPage> {
    return this.http.get<ActivityPage>(
      `${this.api}/activity/me?page=${page}&limit=${limit}`,
      { headers: this.authHeaders(token) },
    );
  }

  // Text mode — direct SSE stream
  streamText(text: string): Observable<PipelineEvent> {
    const url = `${this.api}/orchestrator/stream?text=${encodeURIComponent(text)}&isAudio=false`;
    return this.createSSEObservable(url);
  }

  // Audio mode — Step 1: upload file, get sessionId + transcription
  uploadAudio(file: File): Observable<{ sessionId: string; transcription: string }> {
    const form = new FormData();
    form.append('audio', file);
    return this.http.post<{ sessionId: string; transcription: string }>(
      `${this.api}/orchestrator/upload-audio`,
      form,
    );
  }

  // Audio mode — Step 2: stream pipeline using sessionId
  streamAudio(sessionId: string): Observable<PipelineEvent> {
    const url = `${this.api}/orchestrator/stream?sessionId=${sessionId}&isAudio=true`;
    return this.createSSEObservable(url);
  }

  // Create an Observable that wraps the browser's EventSource (SSE)
  private createSSEObservable(url: string): Observable<PipelineEvent> {
    return new Observable<PipelineEvent>(observer => {
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        this.zone.run(() => {
          try {
            const parsed: PipelineEvent = JSON.parse(event.data);
            observer.next(parsed);

            // Close connection when pipeline is complete or errored
            if (parsed.type === 'complete' || parsed.type === 'error') {
              eventSource.close();
              observer.complete();
            }
          } catch {
            observer.error('Failed to parse SSE event');
          }
        });
      };

      eventSource.onerror = (err) => {
        this.zone.run(() => {
          eventSource.close();
          observer.error(err);
        });
      };

      // Cleanup when unsubscribed
      return () => eventSource.close();
    });
  }
}
