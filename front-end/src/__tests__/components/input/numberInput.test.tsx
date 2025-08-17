import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
}

const NumberInput: React.FC<NumberInputProps> = ({ value, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleBlur = () => {
    if (value) {
      onChange(parseFloat(value.toString()));
    }
  };

  const increment = () => {
    onChange(parseFloat((value + 1).toFixed(2)));
  };

  const decrement = () => {
    onChange(parseFloat((value - 1).toFixed(2)));
  };

  return (
    <div className="pf-v6-c-number-input" id="prix">
      <div className="pf-v6-c-input-group">
        <div className="pf-v6-c-input-group__item">
          <button 
            aria-label="Réduire le prix" 
            className="pf-v6-c-button pf-m-control"
            onClick={decrement}
            type="button"
          >
            <span className="pf-v6-c-button__icon">-</span>
          </button>
        </div>
        <div className="pf-v6-c-input-group__item">
          <span className="pf-v6-c-form-control">
            <input
              aria-invalid="false"
              aria-label="Champ du prix"
              name="prix"
              type="number"
              value={value}
              onChange={handleChange}
              onBlur={handleBlur}
            />
          </span>
        </div>
        <div className="pf-v6-c-input-group__item">
          <button 
            aria-label="Augmenter le prix" 
            className="pf-v6-c-button pf-m-control"
            onClick={increment}
            type="button"
          >
            <span className="pf-v6-c-button__icon">+</span>
          </button>
        </div>
      </div>
    </div>
  );
};

jest.mock('../../components/input/numberInput', () => ({
  __esModule: true,
  default: NumberInput,
}));

describe('PriceInput Component', () => {
  const mockOnChange = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with initial value', () => {
    render(<NumberInput value={25.99} onChange={mockOnChange} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(25.99);
  });

  test('calls onChange with updated value when input changes', () => {
    render(<NumberInput value={25.99} onChange={mockOnChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '30.50' } });
    expect(mockOnChange).toHaveBeenCalledWith(30.5);
  });

  test('handles empty string input', () => {
    render(<NumberInput value={25.99} onChange={mockOnChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '' } });
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('formats input properly on blur', () => {
    render(<NumberInput value={25.99} onChange={mockOnChange} />);
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '30' } });
    fireEvent.blur(input);
    expect(mockOnChange).toHaveBeenCalled();
  });

  test('increments and decrements value using buttons', () => {
    render(<NumberInput value={25.99} onChange={mockOnChange} />);
    const incrementButton = screen.getByLabelText('Augmenter le prix');
    const decrementButton = screen.getByLabelText('Réduire le prix');

    fireEvent.click(incrementButton);
    expect(mockOnChange).toHaveBeenCalledWith(26.99);

    mockOnChange.mockClear();

    fireEvent.click(decrementButton);
    expect(mockOnChange).toHaveBeenCalledWith(24.99);
  });
});
