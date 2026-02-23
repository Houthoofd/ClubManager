import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { useUserContext, UserProvider, useUserContext } from './UserProvider';

describe('useUserContext', () => {
  
  it('should render provider', () => {
    const { container } = render(
      <UserProvider>
        <div>Test</div>
      </UserProvider>
    );

    expect(container).toBeInTheDocument();
  });

  
  it('should use context hook', () => {
    const wrapper = ({ children }) => <UserProvider>{children}</UserProvider>;
    const { result } = renderHook(() => useUserContext(), { wrapper });

    expect(result.current).toBeDefined();
  });

  it('should be defined', () => {
    expect(useUserContext).toBeDefined();
  });
});
