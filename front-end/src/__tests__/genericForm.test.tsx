import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GenericForm from '../components/genericForm';

type FormData = {
  id: number;
  nom: string;
  email: string;
  plan_id: number;
};

type SelectOption = {
  id: number;
  nom_plan: string;
};

type SelectOptions = {
  [key: string]: SelectOption[];
};

type SelectOpenStates = {
  [key: string]: boolean;
};

describe('GenericForm Component', () => {
  const mockFormData: FormData = {
    id: 1,
    nom: 'Test User',
    email: 'test@example.com',
    plan_id: 2
  };

  const mockSelectOptions: SelectOptions = {
    plan_id: [
      { id: 1, nom_plan: 'Basic Plan' },
      { id: 2, nom_plan: 'Premium Plan' },
      { id: 3, nom_plan: 'Pro Plan' }
    ]
  };

  const mockSelectOpenStates: SelectOpenStates = {
    plan_id: false
  };

  const mockOnChange = jest.fn<void, [string, string]>();
  const mockOnSelectToggle = jest.fn<void, [string, boolean]>();
  const mockOnSubmit = jest.fn<void, [React.FormEvent<Element>]>(e => e.preventDefault());

  test('renders correctly with form data', () => {
    render(
      <GenericForm
        formData={mockFormData}
        selectOptions={mockSelectOptions}
        selectOpenStates={mockSelectOpenStates}
        onChange={mockOnChange}
        onSelectToggle={mockOnSelectToggle}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByLabelText(/Nom/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/Email/i)).toHaveValue('test@example.com');
    expect(screen.getByText('Premium Plan')).toBeInTheDocument();
    // Use getAllByRole to get all buttons and check if the submit button exists
    const submitButton = screen.getAllByRole('button').find(button => 
      button.getAttribute('type') === 'submit'
    );
    expect(submitButton).toBeInTheDocument();
  });

  test('calls onChange when text input changes', () => {
    render(
      <GenericForm
        formData={mockFormData}
        selectOptions={mockSelectOptions}
        selectOpenStates={mockSelectOpenStates}
        onChange={mockOnChange}
        onSelectToggle={mockOnSelectToggle}
        onSubmit={mockOnSubmit}
      />
    );
    
    fireEvent.change(screen.getByLabelText(/Nom/i), { target: { value: 'New Name' } });
    
    expect(mockOnChange).toHaveBeenCalledWith('New Name', 'nom');
  });

  test('calls onSelectToggle when dropdown is clicked', () => {
    render(
      <GenericForm
        formData={mockFormData}
        selectOptions={mockSelectOptions}
        selectOpenStates={mockSelectOpenStates}
        onChange={mockOnChange}
        onSelectToggle={mockOnSelectToggle}
        onSubmit={mockOnSubmit}
      />
    );
    
    fireEvent.click(screen.getByText('Premium Plan'));
    
    expect(mockOnSelectToggle).toHaveBeenCalledWith('plan_id', true);
  });

  test('calls onSubmit when form is submitted', () => {
    render(
      <GenericForm
        formData={mockFormData}
        selectOptions={mockSelectOptions}
        selectOpenStates={mockSelectOpenStates}
        onChange={mockOnChange}
        onSelectToggle={mockOnSelectToggle}
        onSubmit={mockOnSubmit}
      />
    );
    
    const form = document.querySelector('form');
    expect(form).toBeInTheDocument();
    
    if (form) {
      fireEvent.submit(form);
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    }
  });
});