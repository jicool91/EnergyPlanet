import { xpThresholdForLevel } from './level';

const DIMINISH_LEVEL_BASE = 400;
const DIMINISH_EXPONENT = 1.3;

const PURCHASE_XP_EXPONENT = 0.75;
const PURCHASE_XP_COEFFICIENT = 2.7011479041326116;

const UPGRADE_XP_EXPONENT = 0.7;
const UPGRADE_XP_COEFFICIENT = 1.2311688331423734;

export interface TransactionXpComputation {
  rawXp: number;
  diminishedXp: number;
  appliedXp: number;
  cap: number;
}

function transactionCapRatio(level: number): number {
  if (level < 100) {
    return 0.4;
  }
  if (level < 300) {
    return 0.33;
  }
  if (level < 600) {
    return 0.28;
  }
  return 0.25;
}

function diminishingMultiplier(level: number): number {
  const safeLevel = Math.max(1, level);
  const normalized = safeLevel / DIMINISH_LEVEL_BASE;
  return 1 / (1 + Math.pow(normalized, DIMINISH_EXPONENT));
}

export function transactionXpCap(level: number): number {
  const threshold = xpThresholdForLevel(level);
  const ratio = transactionCapRatio(level);
  return Math.floor(threshold * ratio);
}

function computeWithCap(rawXp: number, level: number): TransactionXpComputation {
  if (!Number.isFinite(rawXp) || rawXp <= 0) {
    return {
      rawXp: 0,
      diminishedXp: 0,
      appliedXp: 0,
      cap: transactionXpCap(level),
    };
  }

  const diminished = Math.floor(rawXp * diminishingMultiplier(level));
  const cap = transactionXpCap(level);
  const applied = cap > 0 ? Math.min(diminished, cap) : Math.max(0, diminished);

  return {
    rawXp: Math.floor(rawXp),
    diminishedXp: diminished,
    appliedXp: applied,
    cap,
  };
}

export function calculatePurchaseXp(cost: number, level: number): TransactionXpComputation {
  if (!Number.isFinite(cost) || cost <= 0) {
    return computeWithCap(0, level);
  }
  const baseXp = Math.pow(cost, PURCHASE_XP_EXPONENT) * PURCHASE_XP_COEFFICIENT;
  return computeWithCap(baseXp, level);
}

export function calculateUpgradeXp(cost: number, level: number): TransactionXpComputation {
  if (!Number.isFinite(cost) || cost <= 0) {
    return computeWithCap(0, level);
  }
  const baseXp = Math.pow(cost, UPGRADE_XP_EXPONENT) * UPGRADE_XP_COEFFICIENT;
  return computeWithCap(baseXp, level);
}

export function applyTransactionCap(rawXp: number, level: number): TransactionXpComputation {
  return computeWithCap(rawXp, level);
}
