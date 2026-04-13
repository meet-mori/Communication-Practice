import { GrammarService } from './grammar.service';

describe('GrammarService', () => {
  const groqService = {
    chat: jest.fn(),
  };

  let service: GrammarService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new GrammarService(groqService as any);
  });

  it('parses a valid grammar response', async () => {
    groqService.chat.mockResolvedValue('```json\n{"correctedText":"I am happy.","mistakes":["Missing verb"]}\n```');

    await expect(service.handle('I happy')).resolves.toEqual({
      original: 'I happy',
      correctedText: 'I am happy.',
      mistakes: ['Missing verb'],
    });

    expect(groqService.chat).toHaveBeenCalledWith(expect.stringContaining('English grammar expert'), 'I happy');
  });

  it('falls back when the response cannot be parsed', async () => {
    groqService.chat.mockResolvedValue('not json');

    await expect(service.handle('I happy')).resolves.toEqual({
      original: 'I happy',
      correctedText: 'I happy',
      mistakes: ['Could not parse grammar response'],
    });
  });
});