/**
 * Season Controller
 * Handles HTTP requests for season system
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { SeasonService } from '../../services/SeasonService';

const seasonService = new SeasonService();

export class SeasonController {
  /**
   * GET /api/v1/season/current
   * Get current season info
   */
  getCurrent = async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const season = await Promise.resolve(seasonService.getCurrentSeason());

      if (!season) {
        throw new AppError(404, 'season_not_found');
      }

      const isActive = seasonService.isSeasonActive(season);

      res.status(200).json({
        seasonId: season.season.id,
        seasonName: season.season.name,
        seasonNumber: season.season.number,
        description: season.season.description,
        startDate: season.season.dates?.start ?? null,
        endDate: season.season.dates?.end ?? null,
        isActive,
        theme: season.season.theme ?? null,
        multipliers: season.season.multipliers ?? null,
        events: season.season.events ?? [],
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/season/progress
   * Get player's season progress
   */
  getProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const progress = await seasonService.getSeasonProgress(req.user.id);

      if (!progress) {
        throw new AppError(404, 'season_not_found');
      }

      res.status(200).json(progress);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/season/leaderboard
   * Get season leaderboard
   */
  getLeaderboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt((req.query.limit as string) ?? '100', 10);

      if (isNaN(limit) || limit < 1 || limit > 1000) {
        throw new AppError(400, 'invalid_limit');
      }

      const leaderboard = await seasonService.getSeasonLeaderboard(limit);

      res.status(200).json({
        leaderboard,
        total: leaderboard.length,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/season/claim-leaderboard-reward
   * Claim leaderboard reward at end of season
   */
  claimLeaderboardReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const result = await seasonService.claimLeaderboardReward(req.user.id);

      if (!result.success) {
        throw new AppError(400, result.error ?? 'claim_failed');
      }

      res.status(200).json({
        success: true,
        reward: result.reward,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/season/events/:eventId/participate
   * Participate in season event
   */
  participateInEvent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const eventId = req.params.eventId;

      if (!eventId) {
        throw new AppError(400, 'event_id_required');
      }

      const result = await seasonService.participateInEvent(req.user.id, eventId);

      if (!result.success) {
        throw new AppError(400, result.error ?? 'participation_failed');
      }

      res.status(200).json({
        success: true,
        eventId,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/season/events/:eventId/claim-reward
   * Claim season event reward
   */
  claimEventReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const eventId = req.params.eventId;

      if (!eventId) {
        throw new AppError(400, 'event_id_required');
      }

      const result = await seasonService.claimEventReward(req.user.id, eventId);

      if (!result.success) {
        throw new AppError(400, result.error ?? 'claim_failed');
      }

      res.status(200).json({
        success: true,
        eventId,
      });
    } catch (error) {
      next(error);
    }
  };

  purchaseBattlePass = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const result = await seasonService.purchaseBattlePass(req.user.id);
      if (!result.success) {
        throw new AppError(400, result.error ?? 'purchase_failed');
      }

      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  claimBattlePassReward = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'unauthorized');
      }

      const { tier, track } = (req.body ?? {}) as { tier?: unknown; track?: unknown };

      const tierNumber = typeof tier === 'number' ? tier : Number(tier);
      const normalizedTrack = typeof track === 'string' ? track.toLowerCase().trim() : '';
      if (!['free', 'premium'].includes(normalizedTrack)) {
        throw new AppError(400, 'invalid_track');
      }

      if (!Number.isFinite(tierNumber) || tierNumber <= 0) {
        throw new AppError(400, 'invalid_tier');
      }

      const result = await seasonService.claimBattlePassReward(
        req.user.id,
        tierNumber,
        normalizedTrack as 'free' | 'premium'
      );

      if (!result.success) {
        throw new AppError(400, result.error ?? 'claim_failed');
      }

      res.status(200).json({
        success: true,
        reward: result.reward,
      });
    } catch (error) {
      next(error);
    }
  };
}
