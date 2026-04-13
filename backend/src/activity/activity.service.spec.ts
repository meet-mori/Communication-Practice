import { HttpException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  const userId = new ObjectId();
  const authService = {
    requireUser: jest.fn(),
  };
  const activitiesCollection = {
    insertOne: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
  };
  const mongoService = {
    activities: jest.fn(() => activitiesCollection),
  };

  let service: ActivityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivityService(authService as any, mongoService as any);
  });

  it('creates an activity with derived label and snippet', async () => {
    authService.requireUser.mockResolvedValue({
      id: userId.toHexString(),
      name: 'Ana',
      email: 'ana@example.com',
    });
    activitiesCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() });

    await expect(
      service.create('token', {
        score: 7,
        mode: 'audio',
        inputText: '  I practiced speaking today.  ',
        transcription: 'spoken text',
        topicSuggestion: 'daily routine',
      }),
    ).resolves.toEqual({ ok: true });

    expect(activitiesCollection.insertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: expect.any(ObjectId),
        score: 7,
        label: 'Good',
        mode: 'audio',
        inputTextSnippet: 'I practiced speaking today.',
        transcription: 'spoken text',
        topicSuggestion: 'daily routine',
      }),
    );
  });

  it('rejects invalid scores', async () => {
    authService.requireUser.mockResolvedValue({
      id: userId.toHexString(),
      name: 'Ana',
      email: 'ana@example.com',
    });

    await expect(
      service.create('token', {
        score: 11,
        mode: 'text',
        inputText: 'Hello',
      }),
    ).rejects.toBeInstanceOf(HttpException);

    expect(activitiesCollection.insertOne).not.toHaveBeenCalled();
  });

  it('returns paginated history for the authenticated user', async () => {
    authService.requireUser.mockResolvedValue({
      id: userId.toHexString(),
      name: 'Ana',
      email: 'ana@example.com',
    });
    activitiesCollection.countDocuments.mockResolvedValue(3);
    activitiesCollection.find.mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([
        {
          _id: new ObjectId('64b64b64b64b64b64b64b64b'),
          score: 9,
          label: 'Excellent',
          mode: 'text',
          inputTextSnippet: 'A sentence',
          topicSuggestion: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ]),
    });

    await expect(service.myHistory('token', 2, 2)).resolves.toEqual({
      user: {
        id: userId.toHexString(),
        name: 'Ana',
        email: 'ana@example.com',
      },
      pagination: {
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      },
      items: [
        {
          id: '64b64b64b64b64b64b64b64b',
          score: 9,
          label: 'Excellent',
          mode: 'text',
          inputTextSnippet: 'A sentence',
          topicSuggestion: null,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        },
      ],
    });

    expect(activitiesCollection.countDocuments).toHaveBeenCalledWith({
      userId: expect.any(ObjectId),
    });
  });
});