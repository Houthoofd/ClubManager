CREATE TABLE genres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  genre_name VARCHAR(50) NOT NULL
);

-- Insérer les deux genres
INSERT INTO genres (genre_name) VALUES ('Masculin');
INSERT INTO genres (genre_name) VALUES ('Féminin');