import { HttpException } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { WhisperService } from './whisper.service';

jest.mock('axios');
jest.mock('fs', () => ({
  statSync: jest.fn(),
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('WhisperService', () => {
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockedFs = fs as jest.Mocked<typeof fs>;

  let service: WhisperService;

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'GROQ_API_KEY') return 'secret-key';
      return undefined;
    });
    service = new WhisperService(configService);
  });

  it('uploads audio and returns trimmed transcription text', async () => {
    mockedFs.statSync.mockReturnValue({ size: 10 * 1024 * 1024 } as any);
    mockedFs.readFileSync.mockReturnValue(Buffer.from('audio-data'));
    mockedFs.existsSync.mockReturnValue(true);
    mockedAxios.post.mockResolvedValue({ data: { text: '  hello world  ' } });

    await expect(service.transcribe('sample.mp3')).resolves.toBe('hello world');
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith('sample.mp3');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/audio/transcriptions',
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-key',
        }),
      }),
    );
  });

  it('rejects files larger than 25MB and removes them', async () => {
    mockedFs.statSync.mockReturnValue({ size: 26 * 1024 * 1024 } as any);
    mockedFs.existsSync.mockReturnValue(true);

    await expect(service.transcribe('sample.mp3')).rejects.toBeInstanceOf(HttpException);
    try {
      await service.transcribe('sample.mp3');
    } catch (error: any) {
      expect(error.getStatus()).toBe(400);
    }

    expect(mockedFs.unlinkSync).toHaveBeenCalledWith('sample.mp3');
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});