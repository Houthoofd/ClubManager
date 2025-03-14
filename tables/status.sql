CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom_role VARCHAR(50) NOT NULL,
    description TEXT
);

-- Insérer les rôles
INSERT INTO status (nom_role, description)
VALUES
    ('visiteur', "s'est rendu à un cours d'essai, pas encore inscrit dans le système"),
    ('utilisateur', "membre de l'équipe sportive"),
    ('administrateur', "En plus d'être un membre, l'administrateur a quelques droits supplémentaires par rapport au simple utilisateur, ce sont souvent des professeurs"),
    ('super-administrateur', "Le seul et unique, a tous les droits");
