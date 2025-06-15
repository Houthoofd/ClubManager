import React, { useState } from "react";
import '../../app/styles/style-pills.css';

interface PillsProps {
  icon: JSX.Element; // Accepte un élément JSX pour l'icône
  text: string;
}

const Pills: React.FC<PillsProps> = ({ icon, text }) => {
  const [active, setActive] = useState<boolean>(false); // Définition du type booléen pour active

  const toggleActive = () => {
    setActive(prevState => !prevState); // Inverser la valeur de active à chaque clic
  };

  return (
    <div className={`pills-actions ${active ? 'active' : ''}`} onClick={toggleActive}>
      <div className="pills-actions-icon">
        {icon}
      </div>
      <div className="pills-actions-text">
        <span>{text}</span>
      </div>
    </div>
  );
};

export default Pills;

