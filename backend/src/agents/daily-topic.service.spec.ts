import { DailyTopicService } from './daily-topic.service';

describe('DailyTopicService', () => {
  const groqService = {
    chat: jest.fn(),
  };

  let service: DailyTopicService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DailyTopicService(groqService as any);
  });

  it('parses a valid daily topic response', async () => {
    groqService.chat.mockResolvedValue('```json\n{"topic":"Family","reason":"It is familiar.","practicePrompt":"Describe your family."}\n```');

    await expect(
      service.handle(
        'I talked to my mother.',
        {
          original: 'I talked to my mother.',
          correctedText: 'I talked to my mother.',
          mistakes: [],
        },
        {
          enhancedText: 'I talked to my mother.',
          suggestions: [],
        },
        {
          score: 7,
          summary: 'Good progress.',
          encouragement: 'Keep practicing!',
        },
      ),
    ).resolves.toEqual({
      topic: 'Family',
      reason: 'It is familiar.',
      practicePrompt: 'Describe your family.',
    });
  });

  it('falls back when the response cannot be parsed', async () => {
    groqService.chat.mockResolvedValue('invalid response');

    await expect(
      service.handle(
        'I talked to my mother.',
        {
          original: 'I talked to my mother.',
          correctedText: 'I talked to my mother.',
          mistakes: [],
        },
        {
          enhancedText: 'I talked to my mother.',
          suggestions: [],
        },
        {
          score: 7,
          summary: 'Good progress.',
          encouragement: 'Keep practicing!',
        },
      ),
    ).resolves.toEqual({
      topic: 'Talking about your daily routine',
      reason: 'This helps build confidence with common everyday English.',
      practicePrompt: 'Speak for 2 minutes about your morning and evening routine.',
    });
  });
});