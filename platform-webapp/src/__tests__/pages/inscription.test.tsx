import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import fetchMock from 'jest-fetch-mock';
import { InscriptionPage } from '../../pages/inscription';

// Helper to match option or message text regardless of encoding/accent
const matchText = (expected: string) => (text: string) =>
  text &&
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(
    expected.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  );

// Helper to get input by normalized label text (for labels with 'for' attribute)
function getInputByLabel(labelText: string) {
  const labels = Array.from(document.querySelectorAll('label'));
  const label = labels.find(l =>
    l.textContent &&
    l.textContent.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(
      labelText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    )
  );
  if (!label) throw new Error(`Label not found: ${labelText}`);
  const forId = label.getAttribute('for');
  if (!forId) throw new Error(`Label missing 'for' attribute: ${labelText}`);
  const input = document.getElementById(forId);
  if (!input) throw new Error(`Input not found for label: ${labelText}`);
  return input;
}

// Helper to match label text for selects (using aria-label)
const matchLabel = (expected: string) => (label: string) =>
  label &&
  label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(
    expected.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  );

beforeEach(() => {
  fetchMock.resetMocks();
});

describe('InscriptionPage', () => {
  test('affiche tous les champs du formulaire', () => {
    // Mock select options for this test
    fetchMock.mockResponses(
      [JSON.stringify([
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' }
      ]), { status: 200 }],
      [JSON.stringify([
        { value: 'masculin', label: 'Masculin' },
        { value: 'féminin', label: 'Féminin' }
      ]), { status: 200 }]
    );
    render(<InscriptionPage />);
    expect(getInputByLabel('Prénom')).toBeInTheDocument();
    expect(getInputByLabel('Nom')).toBeInTheDocument();
    expect(getInputByLabel('Email')).toBeInTheDocument();
    expect(getInputByLabel('Mot de passe')).toBeInTheDocument();
    expect(getInputByLabel("Date d'inscription")).toBeInTheDocument();
    expect(screen.getByLabelText(matchLabel("Type d'abonnement"), { selector: 'select' })).toBeInTheDocument();
    expect(screen.getByLabelText(matchLabel('Genre'), { selector: 'select' })).toBeInTheDocument();
  });

  test('affiche une erreur si les champs obligatoires sont vides', async () => {
    // Mock select options for this test
    fetchMock.mockResponses(
      [JSON.stringify([
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' }
      ]), { status: 200 }],
      [JSON.stringify([
        { value: 'masculin', label: 'Masculin' },
        { value: 'féminin', label: 'Féminin' }
      ]), { status: 200 }]
    );
    render(<InscriptionPage />);
    fireEvent.click(screen.getByText(/s'inscrire/i));
    await waitFor(() => {
      expect(screen.getByText(matchText('nom est requis'))).toBeInTheDocument();
    });
  });

  test('charge les options d\'abonnement et de genre', async () => {
    fetchMock.mockResponses(
      [JSON.stringify([
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' }
      ]), { status: 200 }],
      [JSON.stringify([
        { value: 'masculin', label: 'Masculin' },
        { value: 'féminin', label: 'Féminin' }
      ]), { status: 200 }]
    );
    render(<InscriptionPage />);
    await waitFor(() => {
      expect(screen.getByText(matchText('féminin'))).toBeInTheDocument();
      expect(screen.getByText(matchText('masculin'))).toBeInTheDocument();
    });
  });

  test('affiche le modal de succès après inscription', async () => {
    fetchMock.mockResponses(
      [JSON.stringify([
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' }
      ]), { status: 200 }],
      [JSON.stringify([
        { value: 'masculin', label: 'Masculin' },
        { value: 'féminin', label: 'Féminin' }
      ]), { status: 200 }],
      [JSON.stringify({ success: true }), { status: 200 }]
    );
    render(<InscriptionPage />);
    // Wait for select options to be loaded
    await waitFor(() => {
      expect(screen.getByText(matchText('féminin'))).toBeInTheDocument();
      expect(screen.getByText(matchText('masculin'))).toBeInTheDocument();
    });
    fireEvent.change(getInputByLabel('Prénom'), { target: { value: 'John' } });
    fireEvent.change(getInputByLabel('Nom'), { target: { value: 'Doe' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'john@example.com' } });
    fireEvent.change(getInputByLabel('Mot de passe'), { target: { value: 'Password1!' } });
    fireEvent.change(getInputByLabel("Date d'inscription"), { target: { value: '2024-06-01' } });
    fireEvent.change(screen.getByLabelText(matchLabel("Type d'abonnement"), { selector: 'select' }), { target: { value: 'standard' } });
    fireEvent.change(screen.getByLabelText(matchLabel('Genre'), { selector: 'select' }), { target: { value: 'masculin' } });
    fireEvent.click(screen.getByText(/s'inscrire/i));
    await waitFor(() => {
      expect(screen.getByText(matchText('inscription réussie'))).toBeInTheDocument();
    });
  });

  test('affiche une erreur si l\'email existe déjà', async () => {
    fetchMock.mockResponses(
      [JSON.stringify([
        { value: 'standard', label: 'Standard' },
        { value: 'premium', label: 'Premium' }
      ]), { status: 200 }],
      [JSON.stringify([
        { value: 'masculin', label: 'Masculin' },
        { value: 'féminin', label: 'Féminin' }
      ]), { status: 200 }],
      [JSON.stringify({ success: false, message: "L'email existe déjà" }), { status: 400 }]
    );
    render(<InscriptionPage />);
    // Wait for select options to be loaded
    await waitFor(() => {
      expect(screen.getByText(matchText('féminin'))).toBeInTheDocument();
      expect(screen.getByText(matchText('masculin'))).toBeInTheDocument();
    });
    fireEvent.change(getInputByLabel('Prénom'), { target: { value: 'Jane' } });
    fireEvent.change(getInputByLabel('Nom'), { target: { value: 'Doe' } });
    fireEvent.change(getInputByLabel('Email'), { target: { value: 'jane@example.com' } });
    fireEvent.change(getInputByLabel('Mot de passe'), { target: { value: 'Password1!' } });
    fireEvent.change(getInputByLabel("Date d'inscription"), { target: { value: '2024-06-01' } });
    fireEvent.change(screen.getByLabelText(matchLabel("Type d'abonnement"), { selector: 'select' }), { target: { value: 'standard' } });
    fireEvent.change(screen.getByLabelText(matchLabel('Genre'), { selector: 'select' }), { target: { value: 'féminin' } });
    fireEvent.click(screen.getByText(/s'inscrire/i));
    await waitFor(() => {
      expect(screen.getByText(matchText('email existe déjà'))).toBeInTheDocument();
    });
  });
});
