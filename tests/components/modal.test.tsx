import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal  from '../../components/modal';

describe('Modal Component', () => {
  it('devrait afficher le message lorsque la modal est ouverte', () => {
    const setShowModal = jest.fn(); // Mock pour setShowModal

    render(
      <Modal showModal={true} setShowModal={setShowModal} message="Ma nouvelle tâche" />
    );

    expect(screen.getByText('Ma nouvelle tâche')).toBeInTheDocument();
  });

  it('ne doit pas afficher la modal lorsque showModal est faux', () => {
    const setShowModal = jest.fn(); // Mock pour setShowModal

    render(
      <Modal showModal={false} setShowModal={setShowModal} message="Tâche ajoutée avec succès" />
    );

    expect(screen.queryByText('Tâche ajoutée avec succès')).not.toBeInTheDocument();
  });

  it('doit afficher la modal lorsque showModal est vrai', () => {
    const setShowModal = jest.fn();

    render(
      <Modal showModal={true} setShowModal={setShowModal} message="Tâche ajoutée avec succès" />
    );

    expect(screen.getByText('Tâche ajoutée avec succès')).toBeInTheDocument();
  });

  it('doit fermer la modal lorsque le bouton Fermer est cliqué', () => {
    const setShowModal = jest.fn();

    render(
      <Modal showModal={true} setShowModal={setShowModal} message="Ma nouvelle tâche" />
    );

    fireEvent.click(screen.getByText('Fermer'));

    expect(setShowModal).toHaveBeenCalledWith(false);
  });
});





