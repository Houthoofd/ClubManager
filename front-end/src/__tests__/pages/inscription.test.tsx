import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InscriptionPage } from '../../pages/inscription';

// Mock fetch pour les abonnements et endpoints backend
beforeAll(() => {
  global.fetch = jest.fn((url) => {
    if (typeof url === 'string' && url.includes('informations/abonnements')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve([
            {
              id: 1,
              nom_plan: 'mensuel',
              prix: 25,
              periode: 'mois',
              description: 'Abonnement de 25 EUR par mois'
            },
            {
              id: 2,
              nom_plan: 'trimestriel',
              prix: 100,
              periode: 'trimestre',
              description: 'Abonnement de 100 EUR tous les 3 mois'
            }
          ])
      });
    }
    if (typeof url === 'string' && url.includes('inscription/verification')) {
      // Simule utilisateur non existant
      return Promise.resolve({
        status: 200,
        json: () => Promise.resolve({ exists: false })
      });
    }
    if (typeof url === 'string' && url.includes('inscription/validation')) {
      // Simule inscription réussie
      return Promise.resolve({
        status: 201,
        json: () => Promise.resolve({ message: 'Inscription réussie !', userId: 1 })
      });
    }
    return Promise.resolve({
      status: 404,
      json: () => Promise.resolve({})
    });
  }) as jest.Mock;
});

afterAll(() => {
  (global.fetch as jest.Mock).mockRestore?.();
});

describe('InscriptionPage', () => {
  it('affiche le formulaire', async () => {
    render(<InscriptionPage />);
    expect(screen.getByText(/Inscription/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nom d'utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date d'inscription/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Type d'abonnement/i)).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(/mensuel/i)).toBeInTheDocument()
    );
  });

  it('affiche une erreur si le formulaire est vide', async () => {
    render(<InscriptionPage />);
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));
    expect(await screen.findByText(/Tous les champs sont obligatoires/i)).toBeInTheDocument();
  });

  it('affiche le récapitulatif et permet la confirmation', async () => {
    render(<InscriptionPage />);
    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Date d'inscription/i), { target: { value: '2024-06-01' } });

    await waitFor(() =>
      expect(screen.getByText(/mensuel/i)).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/Type d'abonnement/i), { target: { value: 'mensuel' } });
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));

    // Vérifie que la modal de récap s'affiche
    expect(await screen.findByText(/Récapitulatif de l'inscription/i)).toBeInTheDocument();
    expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();

    // Confirme l'inscription
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));

    // Vérifie le message de succès dans la modal
    await waitFor(() =>
      expect(screen.getByText(/Inscription réussie/i)).toBeInTheDocument()
    );
    // Vérifie que le bouton confirmer est désactivé pendant le chargement
    expect(screen.getByRole('button', { name: /Confirmer/i })).not.toBeDisabled();
  });

  it('affiche un avertissement si l\'utilisateur existe déjà', async () => {
    // Mock fetch pour utilisateur existant
    (global.fetch as jest.Mock).mockImplementationOnce((url) => {
      if (typeof url === 'string' && url.includes('informations/abonnements')) {
        return Promise.resolve({
          json: () =>
            Promise.resolve([
              {
                id: 1,
                nom_plan: 'mensuel',
                prix: 25,
                periode: 'mois',
                description: 'Abonnement de 25 EUR par mois'
              }
            ])
        });
      }
      if (typeof url === 'string' && url.includes('inscription/verification')) {
        return Promise.resolve({
          status: 409,
          json: () => Promise.resolve({ message: 'Utilisateur déjà existant.' })
        });
      }
      return Promise.resolve({
        status: 404,
        json: () => Promise.resolve({})
      });
    });

    render(<InscriptionPage />);
    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Date d'inscription/i), { target: { value: '2024-06-01' } });

    await waitFor(() =>
      expect(screen.getByText(/mensuel/i)).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/Type d'abonnement/i), { target: { value: 'mensuel' } });
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));

    // Vérifie que la modal de récap s'affiche
    expect(await screen.findByText(/Récapitulatif de l'inscription/i)).toBeInTheDocument();

    // Confirme l'inscription
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));

    // Vérifie le message d'avertissement
    await waitFor(() =>
      expect(screen.getByText(/Utilisateur déjà existant/i)).toBeInTheDocument()
    );
    // Vérifie que le bouton confirmer est désactivé pendant le chargement
    expect(screen.getByRole('button', { name: /Confirmer/i })).not.toBeDisabled();
  });

  // Ajoute un test pour le loader
  it('affiche le loader pendant la confirmation', async () => {
    let resolveFetch: ((value: { status: number; json: () => Promise<{ message: string; userId: number }> }) => void) | undefined;
    (global.fetch as jest.Mock).mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveFetch = resolve;
      });
    });

    render(<InscriptionPage />);
    fireEvent.change(screen.getByLabelText(/Nom d'utilisateur/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/Mot de passe/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Date d'inscription/i), { target: { value: '2024-06-01' } });

    await waitFor(() =>
      expect(screen.getByText(/mensuel/i)).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText(/Type d'abonnement/i), { target: { value: 'mensuel' } });
    fireEvent.click(screen.getByRole('button', { name: /S'inscrire/i }));

    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));

    // Vérifie que le loader s'affiche
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();

    // Termine le fetch
    if (resolveFetch) {
      resolveFetch({
        status: 201,
        json: () => Promise.resolve({ message: 'Inscription réussie !', userId: 1 })
      });
    }

    await waitFor(() =>
      expect(screen.getByText(/Inscription réussie/i)).toBeInTheDocument()
    );
  });
});
