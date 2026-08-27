import { act, renderHook } from '@testing-library/react';
import { usePaperTradingStore } from '../paperTradingStore';

describe('paperTradingStore', () => {
  beforeEach(() => {
    usePaperTradingStore.getState().resetPortfolio();
    usePaperTradingStore.setState({ isPaperMode: false, leaderboard: [] });
  });

  it('starts with a default virtual balance and no positions', () => {
    const { result } = renderHook(() => usePaperTradingStore());
    expect(result.current.isPaperMode).toBe(false);
    expect(result.current.virtualBalance).toBe(10000);
    expect(result.current.positions).toEqual([]);
    expect(result.current.transactions).toEqual([]);
  });

  it('toggles paper mode on and off', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => result.current.togglePaperMode());
    expect(result.current.isPaperMode).toBe(true);

    act(() => result.current.enablePaperMode());
    expect(result.current.isPaperMode).toBe(true);

    act(() => result.current.disablePaperMode());
    expect(result.current.isPaperMode).toBe(false);
  });

  it('buys tokens and records the transaction', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    let outcome: { success: boolean; error?: string } | undefined;
    act(() => {
      outcome = result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
    });

    expect(outcome?.success).toBe(true);
    expect(result.current.virtualBalance).toBe(9000);
    expect(result.current.positions).toHaveLength(1);
    expect(result.current.positions[0].propertyId).toBe('prop-1');
    expect(result.current.positions[0].tokensBought).toBe(10);
    expect(result.current.positions[0].avgBuyPrice).toBe(100);
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].type).toBe('buy');
    expect(result.current.transactions[0].total).toBe(1000);
  });

  it('rejects a buy when the cost exceeds the virtual balance', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    let outcome: { success: boolean; error?: string } | undefined;
    act(() => {
      outcome = result.current.buyTokens('prop-1', 'Manhattan Apt', 200, 100);
    });

    expect(outcome?.success).toBe(false);
    expect(outcome?.error).toBe('Insufficient virtual balance');
    expect(result.current.positions).toEqual([]);
    expect(result.current.virtualBalance).toBe(10000);
  });

  it('rejects non-positive token amounts', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    let outcome: { success: boolean; error?: string } | undefined;
    act(() => {
      outcome = result.current.buyTokens('prop-1', 'Manhattan Apt', 0, 100);
    });

    expect(outcome?.success).toBe(false);
    expect(outcome?.error).toBe('Token amount must be positive');
  });

  it('averages the buy price when adding to an existing position', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
    });
    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 200);
    });

    const position = result.current.positions[0];
    expect(position.tokensBought).toBe(20);
    expect(position.avgBuyPrice).toBe(150); // (100*10 + 200*10) / 20
    expect(result.current.virtualBalance).toBe(7000); // 10000 - 1000 - 2000
  });

  it('sells part of a position and credits the proceeds', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
    });
    let outcome: { success: boolean; error?: string } | undefined;
    act(() => {
      outcome = result.current.sellTokens('prop-1', 4, 150);
    });

    expect(outcome?.success).toBe(true);
    expect(result.current.positions[0].tokensBought).toBe(6);
    expect(result.current.virtualBalance).toBe(9600); // 9000 + 600
    expect(result.current.transactions[0].type).toBe('sell');
  });

  it('closes the position entirely when selling all tokens', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
    });
    act(() => {
      result.current.sellTokens('prop-1', 10, 150);
    });

    expect(result.current.positions).toEqual([]);
    expect(result.current.virtualBalance).toBe(10500); // 9000 + 1500
  });

  it('rejects selling without a position or more tokens than owned', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    let noPosition: { success: boolean; error?: string } | undefined;
    act(() => {
      noPosition = result.current.sellTokens('prop-9', 1, 100);
    });
    expect(noPosition?.error).toBe('No position found for this property');

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 5, 100);
    });
    let tooMany: { success: boolean; error?: string } | undefined;
    act(() => {
      tooMany = result.current.sellTokens('prop-1', 6, 100);
    });
    expect(tooMany?.error).toBe('Cannot sell more tokens than owned');
  });

  it('updates the current price of a position', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
      result.current.updatePrice('prop-1', 120);
    });

    expect(result.current.positions[0].currentPrice).toBe(120);
  });

  it('computes portfolio value, total return and position P&L', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
      result.current.updatePrice('prop-1', 120);
    });

    expect(result.current.getPortfolioValue()).toBe(1200);
    expect(result.current.getPositionPnL('prop-1')).toBe(200); // (120 - 100) * 10
    expect(result.current.getPositionPnL('prop-9')).toBe(0);
    // Total = 9000 balance + 1200 position = 10200 → 2% return over 10000
    expect(result.current.getTotalReturn()).toBe(2);
  });

  it('resetPortfolio restores the starting balance and clears positions', () => {
    const { result } = renderHook(() => usePaperTradingStore());

    act(() => {
      result.current.buyTokens('prop-1', 'Manhattan Apt', 10, 100);
      result.current.resetPortfolio();
    });

    expect(result.current.virtualBalance).toBe(10000);
    expect(result.current.positions).toEqual([]);
    expect(result.current.transactions).toEqual([]);
  });
});
