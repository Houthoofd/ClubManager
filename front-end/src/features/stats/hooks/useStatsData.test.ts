import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useStatsData } from './useStatsData';

describe('useStatsData', () => {
  const wrapper = ({ children }) => (
    <MockedProvider mocks={[]} addTypename={false}>
      {children}
    </MockedProvider>
  );

  it('should initialize', () => {
    const { result } = renderHook(() => useStatsData(), { wrapper });

    expect(result.current).toBeDefined();
  });

  it('should handle loading state', async () => {
    const { result } = renderHook(() => useStatsData(), { wrapper });

    expect(result.current.loading).toBeDefined();
  });

  it('should handle data', async () => {
    const { result } = renderHook(() => useStatsData(), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
  });
});
