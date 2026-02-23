import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { CartProvider, useCart } from './CartProvider';

describe('null', () => {
  
  it('should render provider', () => {
    const { container } = render(
      <CartProvider>
        <div>Test</div>
      </CartProvider>
    );

    expect(container).toBeInTheDocument();
  });

  
  it('should use context hook', () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current).toBeDefined();
  });

  it('should be defined', () => {
    expect(null).toBeDefined();
  });
});
