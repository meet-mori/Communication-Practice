export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  data: T | null;
  message: string;
  code: number;
}
