import { HttpException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { GroqService } from './groq.service';

jest.mock('axios');

describe('GroqService', () => {
  const configService = {
    get: jest.fn(),
  } as unknown as ConfigService;
  const mockedAxios = axios as jest.Mocked<typeof axios>;

  let service: GroqService;

  beforeEach(() => {
    jest.clearAllMocks();
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'GROQ_MODEL') return 'llama-3.1-8b-instant';
      if (key === 'GROQ_API_KEY') return 'secret-key';
      return undefined;
    });
    service = new GroqService(configService);
  });

  it('returns the first chat completion message', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [{ message: { content: 'Hello from Groq' } }],
      },
    });

    await expect(service.chat('system', 'user')).resolves.toBe('Hello from Groq');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.groq.com/openai/v1/chat/completions',
      expect.objectContaining({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: 'system' },
          { role: 'user', content: 'user' },
        ],
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer secret-key',
        }),
      }),
    );
  });

  it('maps request failures to an internal server error', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedAxios.post.mockRejectedValue({
      response: { data: { message: 'failure' } },
      message: 'request failed',
    });

    await expect(service.chat('system', 'user')).rejects.toBeInstanceOf(HttpException);
    try {
      await service.chat('system', 'user');
    } catch (error: any) {
      expect(error.getStatus()).toBe(500);
    }

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});