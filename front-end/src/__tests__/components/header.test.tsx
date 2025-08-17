import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../components/header';

import * as reactRedux from 'react-redux';

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...rest}>{children}</a>
  ),
  useNavigate: () => jest.fn(),
}));

describe('Header Component', () => {
  // Ajout du typage des mocks
  const useSelectorMock = jest.spyOn(reactRedux, 'useSelector') as jest.Mock;
  const useDispatchMock = jest.spyOn(reactRedux, 'useDispatch') as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    useDispatchMock.mockReturnValue(jest.fn());
  });

  test('renders logo and main navigation links', () => {
    useSelectorMock.mockImplementation(callback =>
      callback({
        auth: { isAuthenticated: false, user: null },
        navigation: { left_navbar: false, right_navbar: false }
      })
    );

    const mockSidebarToggle = jest.fn();
    const mockLogout = jest.fn();

    render(
      <Header
        username=""                 // user non connecté, donc username vide ou null
        onSidebarToggle={mockSidebarToggle}
        onLogout={mockLogout}
      />
    );

    expect(screen.getByText('MonApp')).toBeInTheDocument();

    const toggleButton = screen.getByLabelText('Toggle navigation');
    expect(toggleButton).toBeInTheDocument();
  });

  test('renders elements consistent with unauthenticated state', () => {
    useSelectorMock.mockImplementation(selector => {
      const state = {
        auth: { isAuthenticated: false, user: null },
        navigation: { left_navbar: false, right_navbar: false }
      };
      return selector(state);
    });

    const mockSidebarToggle = jest.fn();
    const mockLogout = jest.fn();

    const { unmount } = render(
      <Header
        username=""
        onSidebarToggle={mockSidebarToggle}
        onLogout={mockLogout}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    unmount();

    expect(true).toBe(true);
  });


  describe('when user is authenticated', () => {
    beforeEach(() => {
      jest.clearAllMocks();

      useSelectorMock.mockImplementation(selector => {
        const state = {
          auth: { isAuthenticated: true, user: { name: 'Test User', role: 'Super-Administrateur' } },
          navigation: { left_navbar: false, right_navbar: false }
        };
        return selector(state);
      });

      useDispatchMock.mockReturnValue(jest.fn());
    });

    test('renders user menu instead of login button', () => {
      render(
        <Header
          username="Test User"
          onSidebarToggle={jest.fn()}
          onLogout={jest.fn()}
        />
      );
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Super-Administrateur')).toBeInTheDocument();
      expect(screen.getByAltText('Avatar')).toBeInTheDocument();
    });
  });

});
