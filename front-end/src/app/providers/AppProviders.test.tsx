import { describe, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { AppProviders, AppProviders } from './AppProviders';

describe('AppProviders', () => {
  
  it('should render provider', () => {
    const { container } = render(
      <AppProviders>
        <div>Test</div>
      </AppProviders>
    );

    expect(container).toBeInTheDocument();
  });

  

  it('should be defined', () => {
    expect(AppProviders).toBeDefined();
  });
});
