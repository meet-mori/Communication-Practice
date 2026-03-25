import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ActivityItem,
  AuthUser,
  CoachResult,
  DailyTopicResult,
  GrammarResult,
  OrchestratorService,
  VocabularyResult,
} from '../../services/orchestrator.service';

type InputMode = 'text' | 'audio';

export interface ChatMessage { role: 'user' | 'ai'; text: string; }

export interface AgentCard {
  id: string;
  label: string;
  icon: string;
  status: 'waiting' | 'running' | 'done' | 'idle';
  result?: any;
}

export interface SessionRecord {
  date: string;
  score: number;
  label: string;
  topic: string;
}

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './practice.component.html',
  styleUrls: ['./practice.component.css'],
})
export class PracticeComponent implements OnInit, OnDestroy {
  inputMode: InputMode = 'text';
  userText = '';
  selectedFile: File | null = null;
  fileName = '';
  audioPreviewUrl: string | null = null;
  loading = false;
  uploading = false;
  error = '';

  transcription: string | null = null;
  grammarResult: GrammarResult | null = null;
  vocabResult: VocabularyResult | null = null;
  coachResult: CoachResult | null = null;
  dailyTopicResult: DailyTopicResult | null = null;
  chatMessages: ChatMessage[] = [];

  agents: AgentCard[] = [
    { id: 'whisper', label: 'Whisper', icon: 'W', status: 'idle' },
    { id: 'grammar', label: 'Grammar', icon: 'G', status: 'idle' },
    { id: 'vocabulary', label: 'Vocabulary', icon: 'V', status: 'idle' },
    { id: 'coach', label: 'Coach', icon: 'C', status: 'idle' },
    { id: 'daily-topic', label: 'Daily Topic', icon: 'T', status: 'idle' },
  ];
  currentAgentMsg = '';
  pipelineComplete = false;

  sessions: SessionRecord[] = [];
  showChart = false;
  private sub: Subscription | null = null;

  authUser: AuthUser | null = null;
  authToken = '';
  authName = '';
  authEmail = '';
  authPassword = '';
  authMode: 'login' | 'register' = 'login';
  authBusy = false;
  authError = '';

  ratingHistory: ActivityItem[] = [];
  historyPage = 1;
  historyLimit = 5;
  historyTotal = 0;
  historyTotalPages = 1;

  constructor(private orchestrator: OrchestratorService) {
    this.sessions = [];
  }

  ngOnInit() {
    const token = localStorage.getItem('ec_token') || '';
    if (!token) return;

    this.authToken = token;
    this.orchestrator.me(token).subscribe({
      next: ({ user }) => {
        this.authUser = user;
        this.loadHistory(1);
        this.loadChartData();
      },
      error: () => this.logout(),
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  setAuthMode(mode: 'login' | 'register') {
    this.authMode = mode;
    this.authError = '';
  }

  submitAuth() {
    this.authBusy = true;
    this.authError = '';

    const req = this.authMode === 'register'
      ? this.orchestrator.register(this.authName, this.authEmail, this.authPassword)
      : this.orchestrator.login(this.authEmail, this.authPassword);

    req.subscribe({
      next: ({ token, user }) => {
        this.authBusy = false;
        this.authToken = token;
        this.authUser = user;
        localStorage.setItem('ec_token', token);
        this.authPassword = '';
        this.loadHistory(1);
        this.loadChartData();
      },
      error: (err) => {
        this.authBusy = false;
        this.authError = err?.error?.message || 'Authentication failed';
      },
    });
  }

  logout() {
    this.authToken = '';
    this.authUser = null;
    this.authPassword = '';
    this.ratingHistory = [];
    this.historyPage = 1;
    this.historyTotal = 0;
    this.historyTotalPages = 1;
    this.sessions = [];
    localStorage.removeItem('ec_token');
  }

  private loadHistory(page = 1) {
    if (!this.authToken) return;
    this.orchestrator.myActivities(this.authToken, page, this.historyLimit).subscribe({
      next: (res) => {
        this.ratingHistory = res.items;
        this.historyPage = res.pagination.page;
        this.historyTotal = res.pagination.total;
        this.historyTotalPages = res.pagination.totalPages;
      },
      error: () => {
        this.ratingHistory = [];
        this.historyTotal = 0;
        this.historyTotalPages = 1;
      },
    });
  }

  private loadChartData() {
    if (!this.authToken) return;
    this.orchestrator.myActivities(this.authToken, 1, 5000).subscribe({
      next: (res) => this.syncSessionsFromHistory(res.items),
      error: () => { this.sessions = []; },
    });
  }

  private syncSessionsFromHistory(source: ActivityItem[]) {
    // Keep chart chronological (oldest -> newest) and cap UI load.
    const ordered = [...source].reverse().slice(-200);
    this.sessions = ordered.map((item) => ({
      date: new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      score: item.score,
      label: item.label,
      topic: item.inputTextSnippet,
    }));
  }

  prevHistoryPage() {
    if (this.historyPage <= 1) return;
    this.loadHistory(this.historyPage - 1);
  }

  nextHistoryPage() {
    if (this.historyPage >= this.historyTotalPages) return;
    this.loadHistory(this.historyPage + 1);
  }

  setMode(m: InputMode) {
    this.inputMode = m;
    this.reset();
  }

  onFileSelect(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.mp3') && f.type !== 'audio/mpeg') {
      this.error = 'MP3 only.';
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      this.error = 'Max 25MB.';
      return;
    }
    this.selectedFile = f;
    this.fileName = f.name;
    this.error = '';
    this.audioPreviewUrl = URL.createObjectURL(f);
  }

  submitText() {
    if (!this.authToken) {
      this.error = 'Please login first.';
      return;
    }
    if (!this.userText.trim()) return;
    this.prepareRun(false);
    this.setAgent('grammar', 'waiting');

    this.sub = this.orchestrator.streamText(this.userText).subscribe({
      next: ev => this.handleEvent(ev),
      error: () => {
        this.error = 'Connection failed. Is backend running?';
        this.loading = false;
      },
    });
  }

  submitAudio() {
    if (!this.authToken) {
      this.error = 'Please login first.';
      return;
    }
    if (!this.selectedFile) return;
    this.prepareRun(true);
    this.uploading = true;
    this.setAgent('whisper', 'running');
    this.currentAgentMsg = 'Uploading and transcribing audio...';

    this.orchestrator.uploadAudio(this.selectedFile).subscribe({
      next: ({ sessionId, transcription }) => {
        this.uploading = false;
        this.transcription = transcription;
        this.chatMessages = this.parseConversation(transcription);
        this.setAgent('whisper', 'done');
        this.currentAgentMsg = 'Transcription complete, starting agents...';

        this.sub = this.orchestrator.streamAudio(sessionId).subscribe({
          next: ev => this.handleEvent(ev),
          error: () => {
            this.error = 'Pipeline failed.';
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'Audio upload failed. Is backend running?';
        this.loading = false;
        this.uploading = false;
        this.setAgent('whisper', 'idle');
      },
    });
  }

  private handleEvent(ev: any) {
    switch (ev.type) {
      case 'transcribed':
        this.transcription = ev.data.transcription;
        this.chatMessages = this.parseConversation(ev.data.transcription);
        this.setAgent('whisper', 'done');
        break;

      case 'grammar_start':
        this.setAgent('grammar', 'running');
        this.currentAgentMsg = 'Grammar Agent analyzing your text...';
        break;

      case 'grammar_done':
        this.grammarResult = ev.data;
        this.setAgent('grammar', 'done');
        break;

      case 'vocabulary_start':
        this.setAgent('vocabulary', 'running');
        this.currentAgentMsg = 'Vocabulary Agent improving word choices...';
        break;

      case 'vocabulary_done':
        this.vocabResult = ev.data;
        this.setAgent('vocabulary', 'done');
        break;

      case 'coach_start':
        this.setAgent('coach', 'running');
        this.currentAgentMsg = 'Coach Agent writing your final report...';
        break;

      case 'coach_done':
        this.coachResult = ev.data;
        this.setAgent('coach', 'done');
        break;

      case 'daily_topic_start':
        this.setAgent('daily-topic', 'running');
        this.currentAgentMsg = 'Daily Topic Agent choosing a non-technical topic...';
        break;

      case 'daily_topic_done':
        this.dailyTopicResult = ev.data;
        this.setAgent('daily-topic', 'done');
        break;

      case 'complete':
        this.loading = false;
        this.pipelineComplete = true;
        this.currentAgentMsg = '';

        if (ev?.data?.step4_daily_topic) {
          this.dailyTopicResult = ev.data.step4_daily_topic;
          this.setAgent('daily-topic', 'done');
        } else if (!this.dailyTopicResult) {
          this.dailyTopicResult = {
            topic: 'Talking about your daily routine',
            reason: 'This builds confidence with everyday non-technical English.',
            practicePrompt: 'Speak for 2 minutes about your morning and evening routine.',
          };
          this.setAgent('daily-topic', 'done');
        }

        if (this.coachResult) {
          this.persistActivity();
        }
        break;

      case 'error':
        this.error = ev.message || 'Pipeline error';
        this.loading = false;
        break;
    }
  }

  private persistActivity() {
    if (!this.authToken || !this.coachResult) return;

    this.orchestrator.saveActivity(this.authToken, {
      score: this.coachResult.score,
      mode: this.inputMode,
      inputText: this.userText || '',
      transcription: this.transcription,
      topicSuggestion: this.dailyTopicResult?.topic || null,
    }).subscribe({
      next: () => {
        this.loadHistory(1);
        this.loadChartData();
      },
      error: () => {},
    });
  }

  private setAgent(id: string, status: AgentCard['status']) {
    this.agents = this.agents.map(a => (a.id === id ? { ...a, status } : a));
  }

  private prepareRun(isAudio: boolean) {
    this.loading = true;
    this.error = '';
    this.pipelineComplete = false;
    this.grammarResult = null;
    this.vocabResult = null;
    this.coachResult = null;
    this.dailyTopicResult = null;
    this.transcription = null;
    this.chatMessages = [];
    this.sub?.unsubscribe();

    this.agents = this.agents.map(a => ({
      ...a,
      status: a.id === 'whisper' && !isAudio ? 'idle' : 'waiting',
    }));
  }

  parseConversation(transcript: string): ChatMessage[] {
    const sentences = transcript
      .replace(/([.!?])\s+/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 3);

    const messages: ChatMessage[] = [];
    let buffer = '';
    let role: 'user' | 'ai' = 'user';

    const uInd = ['i think', 'i want', 'i mean', 'can we', 'so yeah', 'yeah so',
      'am i correct', 'what about', 'i understood', 'yeah,', 'okay,', 'okay.', 'got it'];
    const aInd = ["you're right", "you've", 'exactly,', 'absolutely,', 'of course',
      'essentially', 'in other words', "you're absolutely", 'the key', 'in summary'];

    const detect = (s: string): 'user' | 'ai' => {
      const l = s.toLowerCase();
      const wc = l.split(/\s+/).length;
      const u = (wc <= 25 ? 2 : 0) + uInd.filter(i => l.includes(i)).length * 2;
      const a = (wc > 35 ? 2 : 0) + aInd.filter(i => l.includes(i)).length * 2;
      return u >= a ? 'user' : 'ai';
    };

    for (const s of sentences) {
      const r = detect(s);
      if (r === role) {
        buffer += (buffer ? ' ' : '') + s;
      } else {
        if (buffer.trim()) messages.push({ role, text: buffer.trim() });
        buffer = s;
        role = r;
      }
    }
    if (buffer.trim()) messages.push({ role, text: buffer.trim() });
    return messages;
  }

  toggleChart() {
    this.showChart = !this.showChart;
  }

  viewProgress() {
    this.showChart = true;
    setTimeout(() => {
      document.getElementById('progress-chart')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  }

  clearHistory() {
    this.error = 'History is stored permanently in MongoDB and cannot be cleared from this screen.';
  }

  getBarHeight(score: number) {
    return `${score * 10}%`;
  }

  getBarColor(score: number) {
    return score >= 8 ? '#1a6b4a' : score >= 5 ? '#c17d0a' : '#d4501a';
  }

  get avgScore() {
    return this.sessions.length
      ? Math.round((this.sessions.reduce((s, r) => s + r.score, 0) / this.sessions.length) * 10) / 10
      : 0;
  }

  get bestScore() {
    return this.sessions.length ? Math.max(...this.sessions.map(s => s.score)) : 0;
  }

  reset() {
    this.sub?.unsubscribe();
    this.userText = '';
    this.selectedFile = null;
    this.fileName = '';
    this.audioPreviewUrl = null;
    this.loading = false;
    this.uploading = false;
    this.error = '';
    this.pipelineComplete = false;
    this.currentAgentMsg = '';
    this.transcription = null;
    this.grammarResult = null;
    this.vocabResult = null;
    this.coachResult = null;
    this.dailyTopicResult = null;
    this.chatMessages = [];
    this.agents = this.agents.map(a => ({ ...a, status: 'idle' }));
  }

  getScoreColor(score: number) {
    return score >= 8 ? '#1a6b4a' : score >= 5 ? '#c17d0a' : '#d4501a';
  }

  getScoreLabel(score: number) {
    return score >= 9 ? 'Excellent' : score >= 7 ? 'Good' : score >= 5 ? 'Fair' : 'Needs Work';
  }
}
