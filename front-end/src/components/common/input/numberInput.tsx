import React from 'react';
import { NumberInput } from '@patternfly/react-core';

type PriceInputProps = {
  value: number | "";
  onChange: (value: number | "") => void;
  onBlur?: () => void;
};

export const PriceInput: React.FC<PriceInputProps> = ({ value, onChange, onBlur }) => {
  const step = 0.1;
  const min = 0;
  const max = 1000;

  const handlePlus = () => {
    const current = typeof value === "number" ? value : 0;
    const newVal = Math.min(current + step, max);
    onChange(newVal);
  };

  const handleMinus = () => {
    const current = typeof value === "number" ? value : 0;
    const newVal = Math.max(current - step, min);
    onChange(newVal);
  };

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    let inputValue = event.currentTarget.value;
    inputValue = inputValue.replace(',', '.').replace(/[^\d.]/g, '');
    const parts = inputValue.split('.');
    if (parts.length > 2) {
      inputValue = parts[0] + '.' + parts.slice(1).join('');
    }
    if (inputValue === '') {
      onChange("");
    } else {
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
    }
  };

  return (
    <NumberInput
      value={value === "" ? 0 : value}
      onMinus={handleMinus}
      onPlus={handlePlus}
      onChange={handleInputChange}
      inputName="prix"
      inputAriaLabel="Champ du prix"
      minusBtnAriaLabel="Réduire le prix"
      plusBtnAriaLabel="Augmenter le prix"
      id="prix"
      onBlur={onBlur}
      min={min}
      max={max}
    />

  );
};
