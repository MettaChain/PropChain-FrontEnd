/**
 * Fractional ownership maths (#1431).
 *
 * Pure functions over plain data: token distribution for an allocation,
 * proportional dividends, transfers between holders and voting power.
 */

export interface OwnershipAllocation {
  holderId: string;
  /** Share of the property, 0–100. */
  percent: number;
}

export interface OwnershipShare {
  holderId: string;
  tokens: number;
}

export interface TokenHolding {
  holderId: string;
  tokens: number;
}

const round = (value: number, decimals = 6): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

/** Split `totalTokens` across allocations, proportional to their percentage. */
export function calculateTokenDistribution(
  totalTokens: number,
  allocations: OwnershipAllocation[],
): OwnershipShare[] {
  if (totalTokens <= 0) return [];
  return allocations.map((allocation) => ({
    holderId: allocation.holderId,
    tokens: round((totalTokens * allocation.percent) / 100),
  }));
}

/** Dividend owed to a holder for their share of the token supply. */
export function calculateDividend(
  totalDividend: number,
  holderTokens: number,
  totalTokens: number,
): number {
  if (totalDividend <= 0 || holderTokens <= 0 || totalTokens <= 0) return 0;
  return round((totalDividend * holderTokens) / totalTokens, 2);
}

/** Move tokens between two holders, returning a new holdings array. */
export function applyTransfer(
  holdings: TokenHolding[],
  fromHolderId: string,
  toHolderId: string,
  tokens: number,
): TokenHolding[] {
  const sender = holdings.find((holding) => holding.holderId === fromHolderId);
  if (!sender || tokens <= 0) return holdings;
  if (sender.tokens < tokens) {
    throw new Error('Insufficient tokens for transfer');
  }

  const next = holdings.map((holding) => ({ ...holding }));
  next.find((holding) => holding.holderId === fromHolderId)!.tokens -= tokens;
  const receiver = next.find((holding) => holding.holderId === toHolderId);
  if (receiver) {
    receiver.tokens += tokens;
  } else {
    next.push({ holderId: toHolderId, tokens });
  }
  return next;
}

/** Fraction of total voting power held, between 0 and 1. */
export function calculateVotingPower(holderTokens: number, totalTokens: number): number {
  if (holderTokens <= 0 || totalTokens <= 0) return 0;
  return round(Math.min(1, holderTokens / totalTokens), 6);
}

/** Partial sale: reduce a holder's position and return the remaining shares. */
export function applyPartialSale(
  holdings: TokenHolding[],
  holderId: string,
  tokensSold: number,
): TokenHolding[] {
  return applyTransfer(holdings, holderId, 'market', tokensSold);
}
