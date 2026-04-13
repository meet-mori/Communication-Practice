import { CoachService } from './coach.service';

describe('CoachService', () => {
  const groqService = {
    chat: jest.fn(),
  };

  let service: CoachService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CoachService(groqService as any);
  });

  it('parses a valid coach response', async () => {
    groqService.chat.mockResolvedValue('```json\n{"score":8,"summary":"Solid speaking.","encouragement":"Keep going!"}\n```');

    await expect(
      service.handle(
        {
          original: 'I am happy',
          correctedText: 'I am happy',
          mistakes: [],
        },
        {
          enhancedText: 'I am happy',
          suggestions: [],
        },
      ),
    ).resolves.toEqual({
      score: 8,
      summary: 'Solid speaking.',
      encouragement: 'Keep going!',
    });

    expect(groqService.chat).toHaveBeenCalledWith(expect.stringContaining('warm and encouraging English communication coach'), expect.stringContaining('Original text the user spoke: "I am happy"'));
  });

  it('falls back when the response cannot be parsed', async () => {
    groqService.chat.mockResolvedValue('invalid response');

    await expect(
      service.handle(
        {
          original: 'I am happy',
          correctedText: 'I am happy',
          mistakes: ['subject-verb'],
        },
        {
          enhancedText: 'I am delighted',
          suggestions: ['happy -> delighted'],
        },
      ),
    ).resolves.toEqual({
      score: 5,
      summary: 'Could not parse coach response.',
      encouragement: 'Keep practicing every day!',
    });
  });
});