import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../../app/styles/style-breadcrumb.css';

// Composant Breadcrumb
const Breadcrumb = () => {
  const location = useLocation();

  // Séparation du chemin d'URL actuel
  const pathnames = location.pathname.split('/').filter(Boolean);

  // Filtrer 'pages' si présent
  const filteredPathnames = pathnames.filter(pathname => pathname !== 'pages');

  return (
    <nav>
      <ul className="breadcrumb">
        <li>
          <Link to="/">Home</Link>
        </li>
        {filteredPathnames.map((pathname, index) => {
          // Créer un chemin dynamique pour chaque segment
          const to = `/pages/${filteredPathnames.slice(0, index + 1).join('/')}`;

          console.log(to)

          return (
            <li key={to}>
              <Link to={to}>{pathname}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
