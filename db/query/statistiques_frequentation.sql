WITH cours_par_mois AS (
  SELECT
    MONTHNAME(date_cours) as mois,
    MONTH(date_cours) as mois_num,
    YEAR(date_cours) as annee,
    COUNT(DISTINCT DATE(date_cours)) as total_cours_mois
  FROM cours
  GROUP BY YEAR(date_cours), MONTH(date_cours)
),
presences_par_mois AS (
  SELECT
    MONTHNAME(c.date_cours) as mois,
    MONTH(c.date_cours) as mois_num,
    YEAR(c.date_cours) as annee,
    COUNT(DISTINCT DATE(c.date_cours)) as presences_validees
  FROM inscriptions i
  JOIN cours c ON i.cours_id = c.id
  WHERE i.utilisateur_id = 154
  AND i.status_id = 1
  GROUP BY YEAR(c.date_cours), MONTH(c.date_cours)
),
total_frequentation AS (
  SELECT COUNT(*) as total FROM inscriptions WHERE utilisateur_id = 154 AND status_id = 1
)
SELECT
  COALESCE(p.mois, c.mois) as mois,
  COALESCE(p.presences_validees, 0) as frequentation,
  c.total_cours_mois as nombres_total_de_cours_du_mois,
  ROUND(COALESCE(p.presences_validees, 0) * 100.0 / NULLIF(c.total_cours_mois, 0), 2) as pourcentage_de_cours_valides,
  (SELECT total FROM total_frequentation) as totalFrequentation
FROM cours_par_mois c
LEFT JOIN presences_par_mois p ON c.annee = p.annee AND c.mois_num = p.mois_num
ORDER BY c.annee, c.mois_num;
