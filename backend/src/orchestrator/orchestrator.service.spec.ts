import { lastValueFrom, toArray } from 'rxjs';
import { OrchestratorService } from './orchestrator.service';

describe('OrchestratorService', () => {
  const grammarService = {
    handle: jest.fn(),
  };
  const vocabularyService = {
    handle: jest.fn(),
  };
  const coachService = {
    handle: jest.fn(),
  };
  const dailyTopicService = {
    handle: jest.fn(),
  };

  let service: OrchestratorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrchestratorService(
      grammarService as any,
      vocabularyService as any,
      coachService as any,
      dailyTopicService as any,
    );
    (service as any).wait = jest.fn().mockResolvedValue(undefined);
  });

  it('runs the pipeline and emits all completion events', async () => {
    grammarService.handle.mockResolvedValue({
      original: 'I happy',
      correctedText: 'I am happy',
      mistakes: ['Missing verb'],
    });
    vocabularyService.handle.mockResolvedValue({
      enhancedText: 'I am delighted',
      suggestions: ['happy -> delighted'],
    });
    coachService.handle.mockResolvedValue({
      score: 8,
      summary: 'Solid progress.',
      encouragement: 'Keep going!',
    });
    dailyTopicService.handle.mockResolvedValue({
      topic: 'Family',
      reason: 'It is familiar.',
      practicePrompt: 'Describe your family.',
    });

    const events = await lastValueFrom(service.runPipelineSSE('I happy', false).pipe(toArray()));

    expect(events.map(event => event.type)).toEqual([
      'grammar_done',
      'vocabulary_done',
      'coach_start',
      'coach_done',
      'daily_topic_start',
      'daily_topic_done',
      'complete',
    ]);
    expect(grammarService.handle).toHaveBeenCalledWith('I happy');
    expect(vocabularyService.handle).toHaveBeenCalledWith('I happy');
    expect(coachService.handle).toHaveBeenCalledWith(
      expect.objectContaining({ correctedText: 'I am happy' }),
      expect.objectContaining({ enhancedText: 'I am delighted' }),
    );
    expect(dailyTopicService.handle).toHaveBeenCalledWith(
      'I happy',
      expect.objectContaining({ correctedText: 'I am happy' }),
      expect.objectContaining({ enhancedText: 'I am delighted' }),
      expect.objectContaining({ score: 8 }),
    );
  });

  it('emits an error event when a pipeline step fails', async () => {
    grammarService.handle.mockRejectedValue(new Error('grammar failed'));
    vocabularyService.handle.mockResolvedValue({ enhancedText: 'x', suggestions: [] });
    coachService.handle.mockResolvedValue({ score: 5, summary: 'x', encouragement: 'x' });
    dailyTopicService.handle.mockResolvedValue({ topic: 'x', reason: 'x', practicePrompt: 'x' });

    const events = await lastValueFrom(service.runPipelineSSE('I happy', false).pipe(toArray()));

    expect(events[events.length - 1]).toEqual({ type: 'error', message: 'grammar failed' });
  });
});