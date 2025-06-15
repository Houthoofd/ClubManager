import React, { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { SELECT_USER } from '../../redux/actions'; // Assure-toi que l'action est importée
import '../../app/styles/components/carousel.css';

interface User {
  id: string;
  prenom: string;
  nom: string;
}

interface VerticalCarouselProps {
  users: User[];
}

const VerticalCarousel: React.FC<VerticalCarouselProps> = ({ users }) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRef = useRef<HTMLLIElement>(null); // Pour mesurer la hauteur d’un item
  const [itemHeight, setItemHeight] = useState(0);

  const dispatch = useDispatch();

  useEffect(() => {
    if (itemRef.current) {
      setItemHeight(itemRef.current.offsetHeight);
    }
  }, []);

  const scrollList = (direction: "up" | "down") => {
    if (listRef.current && itemHeight) {
      const scrollAmount = itemHeight * 12; // ➡️ Scroll de 12 items
      listRef.current.scrollBy({
        top: direction === "up" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

   // Fonction pour gérer la sélection des utilisateurs dans le carousel
   const handleSelectUser = (user: User) => {
    // Dispatche l'action de sélection d'utilisateurs
    dispatch({
      type: "SELECT_USER",
      payload: user, // Ajouter l'utilisateur sélectionné
    });
  };

  const ReduceFullName = (firstName: string | string[], lastName?: string) => {
    if (!firstName || !lastName) {
      // Si prenom ou nom sont manquants, on retourne un caractère par défaut
      return firstName ? lastName?.charAt(0).toUpperCase() : '';
    }
    // Si on reçoit un tableau (nom complet), on le divise
    if (Array.isArray(firstName)) {
      const [first, last] = firstName;
      const firstInitial = first.charAt(0).toUpperCase();
      const lastInitial = last.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }

    // Si on reçoit deux chaînes (prénom et nom séparés)
    if (lastName) {
      const firstInitial = firstName.charAt(0).toUpperCase();
      const lastInitial = lastName.charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }

    // Si on reçoit une seule chaîne avec un prénom et un nom
    const nameParts = firstName.split(' ');
    if (nameParts.length >= 2) {
      const firstInitial = nameParts[0].charAt(0).toUpperCase();
      const lastInitial = nameParts[1].charAt(0).toUpperCase();
      return `${firstInitial}${lastInitial}`;
    }

    // Sinon, on retourne simplement la première initiale
    return firstName.charAt(0).toUpperCase();
  };

  return (
    <div className="carousel">
      <button onClick={() => scrollList("up")} className="scroll-button">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
          <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z"/>
        </svg>
      </button>

      <ul 
        ref={listRef} 
        style={{ 
          maxHeight: "750px", 
          overflowY: "hidden", // Masquer la barre de défilement
          listStyle: "none", 
          padding: 0, 
          margin: 0, 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {users.map(user => (
          <li key={user.id} className="right-sidebar-list-item" onClick={() => handleSelectUser(user)} ref={itemRef}>
            <span className="avatar-initials">
              {user.first_name} {user.last_name}
            </span>
          </li>
        ))}
      </ul>

      <button onClick={() => scrollList("down")} className="scroll-button">
        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368">
          <path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/>
        </svg>
      </button>
    </div>
  );
};

export default VerticalCarousel;
