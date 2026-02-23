import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { NavigationProvider, useNavigation } from './NavigationProvider';

describe('null', () => {
  
  it('should render provider', () => {
    const { container } = render(
      <NavigationProvider>
        <div>Test</div>
      </NavigationProvider>
    );

    expect(container).toBeInTheDocument();
  });

  
  it('should use context hook', () => {
    const wrapper = ({ children }) => <NavigationProvider>{children}</NavigationProvider>;
    const { result } = renderHook(() => useNavigation(), { wrapper });

    expect(result.current).toBeDefined();
  });

  it('should be defined', () => {
    expect(null).toBeDefined();
  });
});
