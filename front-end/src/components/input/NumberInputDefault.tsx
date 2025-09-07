import React from 'react';
import { NumberInput as PFNumberInput } from '@patternfly/react-core';

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: React.CSSProperties;
  'aria-label'?: string;
};

const NumberInputDefault: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  style,
  ...rest
}) => {
  const handleMinus = () => {
    onChange(Math.max(min, value - step));
  };

  const handlePlus = () => {
    onChange(Math.min(max, value + step));
  };

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const val = event.currentTarget.value;
    onChange(val === '' ? 0 : Number(val));
  };

  return (
    <PFNumberInput
      value={value}
      onMinus={handleMinus}
      onPlus={handlePlus}
      onChange={handleInputChange}
      min={min}
      max={max}
      style={style}
      {...rest}
    />
  );
};

export default NumberInputDefault;
