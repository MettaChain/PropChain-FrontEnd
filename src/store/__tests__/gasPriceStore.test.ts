import { act, renderHook } from '@testing-library/react';
import { useGasPriceStore } from '../gasPriceStore';

describe('gasPriceStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useGasPriceStore.setState({ gasPrice: null, gasPriceThreshold: 20 });
  });

  it('starts with no cached price and the default threshold', () => {
    const { result } = renderHook(() => useGasPriceStore());
    expect(result.current.gasPrice).toBeNull();
    expect(result.current.gasPriceThreshold).toBe(20);
  });

  it('sets the current gas price', () => {
    const { result } = renderHook(() => useGasPriceStore());

    act(() => {
      result.current.setGasPrice(35);
    });

    expect(result.current.gasPrice).toBe(35);
  });

  it('updates an existing gas price', () => {
    const { result } = renderHook(() => useGasPriceStore());

    act(() => {
      result.current.setGasPrice(35);
      result.current.setGasPrice(42);
    });

    expect(result.current.gasPrice).toBe(42);
  });

  it('sets the gas price threshold', () => {
    const { result } = renderHook(() => useGasPriceStore());

    act(() => {
      result.current.setGasPriceThreshold(50);
    });

    expect(result.current.gasPriceThreshold).toBe(50);
  });

  it('persists the cached price across store instances', () => {
    const { result } = renderHook(() => useGasPriceStore());

    act(() => {
      result.current.setGasPrice(60);
      result.current.setGasPriceThreshold(55);
    });

    const { result: result2 } = renderHook(() => useGasPriceStore());
    expect(result2.current.gasPrice).toBe(60);
    expect(result2.current.gasPriceThreshold).toBe(55);
  });
});
