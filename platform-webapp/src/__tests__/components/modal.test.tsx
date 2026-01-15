import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Modal from '../../components/modal';

describe('Modal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders modal when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        title="Test Modal"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        confirmLabel="Confirm"
      >
        <p>Test content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fermer/i })).toBeInTheDocument();
  });

  test('does not render modal when isOpen is false', () => {
    render(
      <Modal
        isOpen={false}
        title="Test Modal"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        confirmLabel="Confirm"
      >
        <p>Test content</p>
      </Modal>
    );

    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(
      <Modal
        isOpen={true}
        title="Test Modal"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        confirmLabel="Confirm"
      >
        <p>Test content</p>
      </Modal>
    );

    fireEvent.click(screen.getByRole('button', { name: /Fermer/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('calls onConfirm when confirm button is clicked', () => {
    render(
      <Modal
        isOpen={true}
        title="Test Modal"
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        confirmLabel="Confirm"
      >
        <p>Test content</p>
      </Modal>
    );

    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  test('renders modal without confirm button when onConfirm is not provided', () => {
    render(
      <Modal
        isOpen={true}
        title="Test Modal"
        onClose={mockOnClose}
      >
        <p>Test content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fermer/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /OK/i })).not.toBeInTheDocument(); // Pas de bouton de confirmation
  });
});
