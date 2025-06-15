import React from 'react';
import { NumberInput } from '@patternfly/react-core';

type PriceInputProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export const PriceInput: React.FC<PriceInputProps> = ({ value, onChange, onBlur }) => {
  const step = 0.1;
  const min = 0;
  const max = 1000;

  const parse = (val: string): number => parseFloat(val.replace(',', '.')) || 0;

  const format = (val: number): string => val.toFixed(2);

  const handlePlus = () => {
    const current = parse(value);
    const newVal = Math.min(current + step, max);
    onChange(format(newVal));
  };

  const handleMinus = () => {
    const current = parse(value);
    const newVal = Math.max(current - step, min);
    onChange(format(newVal));
  };

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    let input = (event.currentTarget as HTMLInputElement).value;
    input = input.replace(',', '.').replace(/[^\d.]/g, '');

    const parts = input.split('.');
    const cleaned = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : input;

    onChange(cleaned);
  };

  return (
    <NumberInput
      value={value}
      onMinus={handleMinus}
      onPlus={handlePlus}
      onChange={handleInputChange}
      inputName="prix"
      inputAriaLabel="Champ du prix"
      minusBtnAriaLabel="Réduire le prix"
      plusBtnAriaLabel="Augmenter le prix"
      id="prix"
      onBlur={onBlur}
    />
  );
};
