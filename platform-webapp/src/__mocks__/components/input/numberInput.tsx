import React from 'react';

// Version mock du composant PriceInput
const PriceInput = ({ value, onChange }) => {
  const handleChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const handleBlur = () => {
    // Simuler le formatage au moment du blur
    if (value) {
      onChange(parseFloat(value));
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

export default PriceInput;
