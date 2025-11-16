import type { PoolClient } from 'pg';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import * as UserRepository from '../repositories/UserRepository';
import * as FriendshipRepository from '../repositories/FriendshipRepository';

const MAX_FRIENDS = 100;
const MAX_PENDING_REQUESTS = 20;
const DAILY_REQUEST_LIMIT_MINUTES = 24 * 60;

export interface FriendEntry {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  status: FriendshipRepository.FriendshipStatus;
  since: string;
}

export interface FriendRequestEntry extends FriendEntry {
  direction: 'incoming' | 'outgoing';
}

export interface FriendsListResponse {
  friends: FriendEntry[];
  incomingRequests: FriendRequestEntry[];
  outgoingRequests: FriendRequestEntry[];
  limits: {
    maxFriends: number;
    maxPendingRequests: number;
    pendingCount: number;
  };
}

export class FriendsService {
  async list(userId: string, client?: PoolClient): Promise<FriendsListResponse> {
    const records = await FriendshipRepository.listFriendshipsForUser(userId, client);

    const friends: FriendEntry[] = [];
    const incomingRequests: FriendRequestEntry[] = [];
    const outgoingRequests: FriendRequestEntry[] = [];

    for (const record of records) {
      const base: FriendEntry = {
        userId: record.friendUserId,
        username: record.friendUsername,
        firstName: record.friendFirstName,
        lastName: record.friendLastName,
        status: record.status,
        since: record.createdAt.toISOString(),
      };

      if (record.status === 'accepted') {
        friends.push(base);
        continue;
      }

      if (record.status === 'pending') {
        const direction: 'incoming' | 'outgoing' = record.initiatorId === userId ? 'outgoing' : 'incoming';
        const entry: FriendRequestEntry = {
          ...base,
          direction,
        };
        if (direction === 'incoming') {
          incomingRequests.push(entry);
        } else {
          outgoingRequests.push(entry);
        }
      }
    }

    const pendingCount = outgoingRequests.length;

    return {
      friends,
      incomingRequests,
      outgoingRequests,
      limits: {
        maxFriends: MAX_FRIENDS,
        maxPendingRequests: MAX_PENDING_REQUESTS,
        pendingCount,
      },
    };
  }

  private async ensureUserExists(userId: string, client?: PoolClient) {
    const user = await UserRepository.findById(userId, client);
    if (!user) {
      throw new AppError(404, 'user_not_found');
    }
    if (user.isBanned) {
      throw new AppError(400, 'user_unavailable');
    }
  }

  async sendRequest(userId: string, targetUserId: string, client?: PoolClient) {
    if (userId === targetUserId) {
      throw new AppError(400, 'cannot_friend_self');
    }

    await this.ensureUserExists(targetUserId, client);

    const friendsCount = await FriendshipRepository.countFriendshipsByStatus(userId, 'accepted', client);
    if (friendsCount >= MAX_FRIENDS) {
      throw new AppError(400, 'friends_limit_reached');
    }

    const pendingCount = await FriendshipRepository.countOutgoingPending(userId, client);
    if (pendingCount >= MAX_PENDING_REQUESTS) {
      throw new AppError(400, 'pending_limit_reached');
    }

    const recentCount = await FriendshipRepository.countOutgoingRequestsWithin(
      userId,
      DAILY_REQUEST_LIMIT_MINUTES,
      client
    );
    if (recentCount >= MAX_PENDING_REQUESTS) {
      throw new AppError(429, 'too_many_requests');
    }

    const existing = await FriendshipRepository.getFriendship(userId, targetUserId, client);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new AppError(400, 'already_friends');
      }
      if (existing.status === 'pending') {
        if (existing.initiatorId === userId) {
          throw new AppError(400, 'request_already_sent');
        }
        // Auto-accept if the other user had sent a request
        await FriendshipRepository.updateFriendshipStatus(existing.id, 'accepted', userId, client);
        await FriendshipRepository.insertEvent(existing.id, 'accepted', userId, { auto: true }, client);
        logger.info({ userId, targetUserId }, 'friend_request_auto_accepted');
        return;
      }
      if (existing.status === 'blocked') {
        throw new AppError(400, 'cannot_friend_blocked');
      }
    }

    const { userOneId, userTwoId } = FriendshipRepository.normalizePair(userId, targetUserId);
    const record = await FriendshipRepository.createFriendship(
      {
        userOneId,
        userTwoId,
        initiatorId: userId,
        status: 'pending',
      },
      client
    );

    await FriendshipRepository.insertEvent(record.id, 'request_sent', userId, {}, client);
    logger.info({ userId, targetUserId }, 'friend_request_created');
  }

  async acceptRequest(userId: string, requesterId: string, client?: PoolClient) {
    const friendship = await FriendshipRepository.getFriendship(userId, requesterId, client);
    if (!friendship || friendship.status !== 'pending') {
      throw new AppError(404, 'request_not_found');
    }
    if (friendship.initiatorId !== requesterId) {
      throw new AppError(400, 'not_request_owner');
    }

    await FriendshipRepository.updateFriendshipStatus(friendship.id, 'accepted', userId, client);
    await FriendshipRepository.insertEvent(friendship.id, 'accepted', userId, {}, client);
  }

  async declineRequest(userId: string, requesterId: string, client?: PoolClient) {
    const friendship = await FriendshipRepository.getFriendship(userId, requesterId, client);
    if (!friendship || friendship.status !== 'pending') {
      throw new AppError(404, 'request_not_found');
    }
    if (friendship.initiatorId !== requesterId) {
      throw new AppError(400, 'not_request_owner');
    }

    await FriendshipRepository.deleteFriendship(friendship.id, client);
    await FriendshipRepository.insertEvent(friendship.id, 'declined', userId, {}, client);
  }

  async removeFriend(userId: string, targetUserId: string, client?: PoolClient) {
    const friendship = await FriendshipRepository.getFriendship(userId, targetUserId, client);
    if (!friendship || friendship.status !== 'accepted') {
      throw new AppError(404, 'friendship_not_found');
    }

    await FriendshipRepository.deleteFriendship(friendship.id, client);
    await FriendshipRepository.insertEvent(friendship.id, 'removed', userId, {}, client);
  }
}

export const friendsService = new FriendsService();
