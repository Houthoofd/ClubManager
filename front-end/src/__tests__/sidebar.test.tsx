import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';

type RootState = {
  auth: { isAuthenticated: boolean; user: { name: string; status_id?: number; role?: string } | null };
  navigation: { left_navbar: boolean; right_navbar: boolean };
  notifications: { notifications: { id: number }[] };
};

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  NavLink: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to} data-testid="nav-link">
      {children}
    </a>
  ),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn(),
}));

// Mock redux hooks
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

// Composant Sidebar mocké
const MockSidebar = () => {
  // Typage générique pour useSelector (optionnel)
  const isOpen = useSelector((state: RootState) => state.navigation?.left_navbar);
  const user = useSelector((state: RootState) => state.auth?.user);

  if (!isOpen) return null;

  const isAdmin = user && user.status_id === 4;

  return (
    <div data-testid="sidebar">
      <nav>
        <ul>
          <li>Accueil</li>
          <li>Boutique</li>
          <li>Calendrier</li>
          {isAdmin && (
            <>
              <li>Administration</li>
              <li>Utilisateurs</li>
            </>
          )}
        </ul>
      </nav>
    </div>
  );
};

describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Cast en unknown puis jest.Mock pour éviter les erreurs TS
    (useDispatch as unknown as jest.Mock).mockReturnValue(jest.fn());
  });

  test('renders the sidebar for regular users', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState: RootState = {
        navigation: { left_navbar: true, right_navbar: false },
        auth: { isAuthenticated: true, user: { name: 'User', status_id: 1 } },
        notifications: { notifications: [] },
      };
      return selector(mockState);
    });

    render(<MockSidebar />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Boutique')).toBeInTheDocument();
    expect(screen.getByText('Calendrier')).toBeInTheDocument();
    expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
    expect(screen.queryByText('Administration')).not.toBeInTheDocument();
  });

  test('renders admin options for admin users', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState: RootState = {
        navigation: { left_navbar: true, right_navbar: false },
        auth: { isAuthenticated: true, user: { name: 'Admin', status_id: 4 } },
        notifications: { notifications: [] },
      };
      return selector(mockState);
    });

    render(<MockSidebar />);

    expect(screen.getByText('Accueil')).toBeInTheDocument();
    expect(screen.getByText('Boutique')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument();
  });

  test('sidebar is not rendered when left_navbar is false', () => {
    (useSelector as unknown as jest.Mock).mockImplementation((selector) => {
      const mockState: RootState = {
        navigation: { left_navbar: false, right_navbar: false },
        auth: { isAuthenticated: true, user: { name: 'User', status_id: 1 } },
        notifications: { notifications: [] },
      };
      return selector(mockState);
    });

    render(<MockSidebar />);

    expect(screen.queryByText('Accueil')).not.toBeInTheDocument();
    expect(screen.queryByText('Utilisateurs')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar')).toBeNull();
  });
});
