SELECT 
    c.id AS cours_id,
    c.date_cours,
    c.type_cours,
    u.id AS utilisateur_id,
    CONCAT(u.first_name, ' ', u.last_name) AS nom_complet,
    u.email
FROM inscriptions i
JOIN utilisateurs u ON i.utilisateur_id = u.id
JOIN cours c ON i.cours_id = c.id
WHERE c.id = ?  -- Remplace le ? par l'id du cours recherché
ORDER BY u.last_name, u.first_name;