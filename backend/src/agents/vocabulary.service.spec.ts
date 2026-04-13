import { VocabularyService } from './vocabulary.service';

describe('VocabularyService', () => {
  const groqService = {
    chat: jest.fn(),
  };

  let service: VocabularyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VocabularyService(groqService as any);
  });

  it('parses a valid vocabulary response', async () => {
    groqService.chat.mockResolvedValue('```json\n{"enhancedText":"I am thrilled.","suggestions":["happy was replaced with thrilled"]}\n```');

    await expect(service.handle('I am happy')).resolves.toEqual({
      enhancedText: 'I am thrilled.',
      suggestions: ['happy was replaced with thrilled'],
    });

    expect(groqService.chat).toHaveBeenCalledWith(expect.stringContaining('English vocabulary coach'), 'I am happy');
  });

  it('falls back when the response cannot be parsed', async () => {
    groqService.chat.mockResolvedValue('invalid response');

    await expect(service.handle('I am happy')).resolves.toEqual({
      enhancedText: 'I am happy',
      suggestions: ['Could not parse vocabulary response'],
    });
  });
});