import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Compte from '../../pages/compte';
import '@testing-library/jest-dom';

// Mock fetch pour abonnements, grades, status et userData
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    if (typeof url === 'string' && url.includes('informations/abonnements')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, nom_plan: 'mensuel', prix: 25, periode: 'mois', description: 'Abonnement mensuel' },
            { id: 2, nom_plan: 'trimestriel', prix: 60, periode: 'trimestre', description: 'Abonnement trimestriel' }
          ])
      });
    }
    if (typeof url === 'string' && url.includes('informations/grades')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, grade_id: 'ceinture blanche' },
            { id: 2, grade_id: 'ceinture bleue' }
          ])
      });
    }
    if (typeof url === 'string' && url.includes('informations/status')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve([
            { id: 1, nom_role: 'utilisateur', description: 'Membre' },
            { id: 2, nom_role: 'administrateur', description: 'Admin' }
          ])
      });
    }
    if (typeof url === 'string' && url.includes('api/compte/informations')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            utilisateur: {
              first_name: 'Jean',
              last_name: 'Dupont',
              email: 'jean.dupont@example.com',
              date_of_birth: '1990-01-01',
              abonnement: 'mensuel',
              genres: 'Masculin',
              grades: 'ceinture blanche',
              nom_utilisateur: 'jeandupont',
              status: 'utilisateur',
              password: 'hashedpassword'
            }
          })
      });
    }
    return Promise.resolve({
      json: () => Promise.resolve({})
    });
  }) as jest.Mock;
  // Mock localStorage
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() =>
        JSON.stringify({
          data: {
            prenom: 'Jean',
            nom: 'Dupont'
          }
        })
      ),
      setItem: jest.fn(),
      removeItem: jest.fn()
    }
  });
});

afterAll(() => {
  (global.fetch as jest.Mock).mockRestore?.();
});

describe('Compte page', () => {
  it('affiche le loader puis les infos du compte', async () => {
    render(<Compte />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Compte/i)).toBeInTheDocument());
    expect(screen.getByDisplayValue('Jean')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jeandupont')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('[Mot de passe non affichable : hash bcrypt]')).toBeInTheDocument();
  });

  it('affiche les abonnements et grades dans les selects', async () => {
    render(<Compte />);
    await waitFor(() => expect(screen.getByText(/Informations supplémentaires/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Informations supplémentaires/i));
    expect(screen.getByText(/ceinture blanche/i)).toBeInTheDocument();
    expect(screen.getByText(/ceinture bleue/i)).toBeInTheDocument();
    expect(screen.getByText(/mensuel/i)).toBeInTheDocument();
    expect(screen.getByText(/trimestriel/i)).toBeInTheDocument();
  });

  it('affiche les rôles dans le select', async () => {
    render(<Compte />);
    await waitFor(() => expect(screen.getByText(/Rôle et statut/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Rôle et statut/i));
    // Utilise getAllByText pour éviter l'erreur sur les doublons
    const utilisateurOptions = screen.getAllByText(/utilisateur/i);
    const administrateurOptions = screen.getAllByText(/administrateur/i);
    // Vérifie qu'il y a au moins une option pour chaque rôle
    expect(utilisateurOptions.length).toBeGreaterThan(0);
    expect(administrateurOptions.length).toBeGreaterThan(0);
  });

  it('peut activer l\'édition d\'un champ', async () => {
    render(<Compte />);
    await waitFor(() => expect(screen.getByText(/Informations supplémentaires/i)).toBeInTheDocument());
    fireEvent.click(screen.getByText(/Informations supplémentaires/i));
    const editBtn = screen.getAllByLabelText(/Editer/i)[0];
    fireEvent.click(editBtn);
    // Le bouton doit maintenant afficher "Terminer"
    expect(screen.getAllByLabelText(/Terminer/i)[0]).toBeInTheDocument();
  });

  it('affiche la modal de changements', async () => {
    render(<Compte />);
    await waitFor(() => expect(screen.getByText(/Compte/i)).toBeInTheDocument());
    const btn = screen.getByRole('button', { name: /Voir les changements effectués/i });
    fireEvent.click(btn);
    expect(await screen.findByText(/Résumé des changements/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Valider/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
  });
});
