import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import type { EnhancedStore } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';

type RootState = {
  auth: { isAuthenticated: boolean; user: { name: string; role?: string } | null };
  navigation: { left_navbar: boolean; right_navbar: boolean };
  notifications: { notifications: { id: number }[] };
};

// Mock composants
const MockLeftPanel = ({ isOpen }: { isOpen: boolean }) => (
  <div
    data-testid="left-panel"
    className={isOpen ? 'left-panel open' : 'left-panel closed'}
  >
    Left Panel Content
  </div>
);

const MockRightPanel = ({ isOpen }: { isOpen: boolean }) => (
  <div
    data-testid="right-panel"
    className={isOpen ? 'right-panel open' : 'right-panel closed'}
  >
    Right Panel Content
  </div>
);

const LeftPanel = ({ isOpen }: { isOpen: boolean }) => <MockLeftPanel isOpen={isOpen} />;
const RightPanel = ({ isOpen }: { isOpen: boolean }) => <MockRightPanel isOpen={isOpen} />;

// Création du store mock avec configureStore
const createMockStore = (initialState: RootState): EnhancedStore<RootState> => {
  return configureStore({
    reducer: (state = initialState) => state, // simple reducer qui renvoie toujours le state donné
  });
};

describe('Panel Components', () => {
  test('left panel renders with open class when left_navbar is true', () => {
    const store = createMockStore({
      navigation: { left_navbar: true, right_navbar: false },
      auth: { isAuthenticated: true, user: { name: 'Admin', role: 'admin' } },
      notifications: { notifications: [] },
    });

    render(
      <Provider store={store}>
        <LeftPanel isOpen={true} />
      </Provider>
    );

    const panel = screen.getByTestId('left-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('open');
  });

  test('left panel renders with closed class when left_navbar is false', () => {
    const store = createMockStore({
      navigation: { left_navbar: false, right_navbar: false },
      auth: { isAuthenticated: true, user: { name: 'Admin', role: 'admin' } },
      notifications: { notifications: [] },
    });

    render(
      <Provider store={store}>
        <LeftPanel isOpen={false} />
      </Provider>
    );

    const panel = screen.getByTestId('left-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('closed');
  });

  test('right panel renders with open class when right_navbar is true', () => {
    const store = createMockStore({
      navigation: { left_navbar: false, right_navbar: true },
      auth: { isAuthenticated: true, user: null },
      notifications: { notifications: [] },
    });

    render(
      <Provider store={store}>
        <RightPanel isOpen={true} />
      </Provider>
    );

    const panel = screen.getByTestId('right-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('open');
  });

  test('right panel renders with closed class when right_navbar is false', () => {
    const store = createMockStore({
      navigation: { left_navbar: false, right_navbar: false },
      auth: { isAuthenticated: true, user: null },
      notifications: { notifications: [] },
    });

    render(
      <Provider store={store}>
        <RightPanel isOpen={false} />
      </Provider>
    );

    const panel = screen.getByTestId('right-panel');
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveClass('closed');
  });
});
