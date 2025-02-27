import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskManager from '../../components/task-manager';
import { NotificationProvider } from '../../context/notification';

describe('TaskManager', () => {
  const renderWithProvider = (ui: JSX.Element) => {
    return render(
      <NotificationProvider>
        {ui}
      </NotificationProvider>
    );
  };

  it('devrait ajouter une tâche à la liste lorsque la fonction handleAddTask est appelée', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(<TaskManager />);
    const input = getByPlaceholderText('Nouvelle tâche');
    const button = getByText('Ajouter');

    // Simuler l'ajout d'une tâche
    fireEvent.change(input, { target: { value: 'Nouvelle tâche' } });
    fireEvent.click(button);

    // Vérifier si la tâche est ajoutée à la liste
    expect(getByText('Nouvelle tâche')).toBeInTheDocument();
  });

  test('ne doit pas ajouter une tâche vide', () => {
    // Utiliser renderWithProvider pour fournir le contexte
    renderWithProvider(<TaskManager />);

    // Récupérer l'input et le bouton
    const input = screen.getByPlaceholderText('Nouvelle tâche');
    const button = screen.getByText('Ajouter');

    // Simuler le clic sur "Ajouter" sans entrer de texte
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(button);

    // Vérifier que la liste des tâches est vide (ou pas modifiée)
    const taskList = screen.queryByRole('list');
    expect(taskList?.children.length).toBe(0);
  });
});
