import React from 'react';
import { TextInput } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Rechercher...",
  style = { marginBottom: 16 }
}) => {
  return (
    <div style={style}>
      <TextInput
        type="search"
        value={value}
        onChange={(_e, value) => onChange(value)}
        placeholder={placeholder}
        iconVariant="search"
      />
    </div>
  );
};

export default SearchInput;
