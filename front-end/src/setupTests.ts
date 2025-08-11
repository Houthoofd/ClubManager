// Configuration pour les tests avec Jest
import '@testing-library/jest-dom'; // La nouvelle façon d'importer jest-dom

// Polyfill pour TextEncoder/TextDecoder qui est requis par React Router v6
class TextEncoderPolyfill {
  encode(input: string): Uint8Array {
    const utf8 = unescape(encodeURIComponent(input));
    const result = new Uint8Array(utf8.length);
    for (let i = 0; i < utf8.length; i++) {
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
    for (let i = 0; i < input.length; i++) {
      result += String.fromCharCode(input[i]);
    }
    return decodeURIComponent(escape(result));
  }
}

// Ajouter TextEncoder et TextDecoder au scope global
global.TextEncoder = TextEncoderPolyfill;
global.TextDecoder = TextDecoderPolyfill;

// Mock des hooks Redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: (fn) => {
    const state = {
      settings: { darkMode: false },
      navigation: { 
        left_navbar: false,
        right_navbar: false,
        header_right_panel: false
      },
      notifications: { notifications: [] }
    };
    return fn(state);
  },
  Provider: function Provider({ children }) { return children; }
}));

// Mock de react-router-dom
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    // Utilisez des fonctions simples sans dépendance à React
    Link: function Link(props) {
      return {
        type: 'a',
        props: {
          href: props.to,
          children: props.children
        }
      };
    },
    Outlet: function Outlet() {
      return {
        type: 'div',
        props: {
          'data-testid': 'outlet'
        }
      };
    }
  };
});

// Mock complet de localStorage pour satisfaire l'interface Storage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(index => null),
  length: 0
};

// Assigner le mock à window.localStorage au lieu de global.localStorage
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Configuration par défaut pour localStorage.getItem
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockImplementation(key => {
    if (key === 'userData') {
      return JSON.stringify({
        data: {
          id: 1,
          nom: "Test User",
          prenom: "Test",
          email: "test@example.com",
          status_id: 4
        }
      });
    }
    return null;
  });
});

// Correction du mock pour MutationObserver avec l'implémentation de takeRecords
class MockMutationObserver {
  constructor(callback) {
    this.callback = callback;
  }
  
  observe(_element, _options) {
    // Implémentation vide
  }
  
  disconnect() {
    // Implémentation vide
  }
  
  takeRecords() {
    return [];
  }
}

global.MutationObserver = MockMutationObserver;
