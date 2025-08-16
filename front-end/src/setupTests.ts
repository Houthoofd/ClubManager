// Configuration pour les tests avec Jest
import '@testing-library/jest-dom'; // Import moderne pour jest-dom

// Polyfill pour TextEncoder/TextDecoder requis par React Router v6
class TextEncoderPolyfill {
  encode(input: string): Uint8Array {
    const utf8 = unescape(encodeURIComponent(input));
    const result = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i += 1) {
      result[i] = utf8.charCodeAt(i);
    }
    return result;
  }
}

class TextDecoderPolyfill {
  decode(input?: Uint8Array): string {
    if (!input) {
      return '';
    }
    let result = '';
    for (let i = 0; i < input.length; i += 1) {
      result += String.fromCharCode(input[i]);
    }
    return decodeURIComponent(escape(result));
  }
}

// Ajouter TextEncoder et TextDecoder au scope global
(global as unknown as typeof globalThis).TextEncoder = TextEncoderPolyfill as unknown as typeof TextEncoder;
(global as unknown as typeof globalThis).TextDecoder = TextDecoderPolyfill as unknown as typeof TextDecoder;

// Mock des hooks Redux
jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');
  return {
    ...actual,
    useDispatch: () => jest.fn(),
    useSelector: <T>(fn: (state: T) => unknown) => {
      const state = {
        settings: { darkMode: false },
        navigation: {
          left_navbar: false,
          right_navbar: false,
          header_right_panel: false,
        },
        notifications: { notifications: [] },
      } as T;
      return fn(state);
    },
    Provider: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock de react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    Link: ({ to, children }: { to: string; children: React.ReactNode }) => ({
      type: 'a',
      props: { href: to, children },
    }),
    Outlet: () => ({
      type: 'div',
      props: { 'data-testid': 'outlet' },
    }),
  };
});

// Mock complet de localStorage
const localStorageMock: Storage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(() => null),
  length: 0,
};

// Assigner le mock à window.localStorage
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Config par défaut pour localStorage.getItem
beforeEach(() => {
  jest.clearAllMocks();
  (localStorageMock.getItem as jest.Mock).mockImplementation((key: string) => {
    if (key === 'userData') {
      return JSON.stringify({
        data: {
          id: 1,
          nom: 'Test User',
          prenom: 'Test',
          email: 'test@example.com',
          status_id: 4,
        },
      });
    }
    return null;
  });
});

// Mock de MutationObserver
class MockMutationObserver implements MutationObserver {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_callback: MutationCallback) {
    // Ne rien stocker, le paramètre n'est pas utilisé
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  observe(_target: Node, _options: MutationObserverInit): void {
    // Implémentation vide
  }

  disconnect(): void {
    // Implémentation vide
  }

  takeRecords(): MutationRecord[] {
    return [];
  }
}

(global as unknown as typeof globalThis).MutationObserver = MockMutationObserver;
(global as unknown as typeof globalThis).MutationObserver = MockMutationObserver;
