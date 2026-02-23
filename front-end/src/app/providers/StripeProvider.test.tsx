import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { StripeProvider, StripeProvider } from './StripeProvider';

describe('StripeProvider', () => {
  
  it('should render provider', () => {
    const { container } = render(
      <StripeProvider>
        <div>Test</div>
      </StripeProvider>
    );

    expect(container).toBeInTheDocument();
  });

  

  it('should be defined', () => {
    expect(StripeProvider).toBeDefined();
  });
});
