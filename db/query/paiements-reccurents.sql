TRUNCATE TABLE echeances_paiements;

INSERT INTO echeances_paiements (utilisateur_id, abonnement_id, date_echeance, montant, statut)
SELECT
    u.id AS utilisateur_id,
    u.abonnement_id,
    CASE
        WHEN pt.periode = 'mois' THEN LAST_DAY(DATE_ADD(u.date_inscription, INTERVAL n MONTH))
        WHEN pt.periode = 'trimestre' THEN LAST_DAY(DATE_ADD(u.date_inscription, INTERVAL n*3 MONTH))
        WHEN pt.periode = 'an' THEN LAST_DAY(DATE_ADD(u.date_inscription, INTERVAL n YEAR))
    END AS date_echeance,
    -- Calcul du montant proratisé pour la première échéance
    CASE
        WHEN n = 0 THEN
            ROUND(
                pt.prix *
                CASE pt.periode
                    WHEN 'mois' THEN (DAY(LAST_DAY(u.date_inscription)) - DAY(u.date_inscription) + 1) / DAY(LAST_DAY(u.date_inscription))
                    WHEN 'trimestre' THEN 
                        (DATEDIFF(DATE_ADD(LAST_DAY(u.date_inscription), INTERVAL 2 MONTH), u.date_inscription) + 1) / 
                        DATEDIFF(DATE_ADD(LAST_DAY(u.date_inscription), INTERVAL 2 MONTH), LAST_DAY(DATE_SUB(u.date_inscription, INTERVAL 1 MONTH)) + 1)
                    WHEN 'an' THEN 
                        (DATEDIFF(DATE_ADD(LAST_DAY(u.date_inscription), INTERVAL 11 MONTH), u.date_inscription) + 1) / 
                        DATEDIFF(DATE_ADD(LAST_DAY(u.date_inscription), INTERVAL 11 MONTH), LAST_DAY(DATE_SUB(u.date_inscription, INTERVAL 1 MONTH)) + 1)
                END,
                2
            )
        ELSE pt.prix
    END AS montant,
    'en attente' AS statut
FROM utilisateurs u
JOIN plans_tarifaires pt ON u.abonnement_id = pt.id
CROSS JOIN (
    SELECT 0 AS n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
    UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7
    UNION SELECT 8 UNION SELECT 9 UNION SELECT 10 UNION SELECT 11
) numbers
WHERE u.abonnement_id IS NOT NULL
AND pt.id IS NOT NULL
AND (
    (pt.periode = 'mois'      AND n BETWEEN 0 AND 11)
    OR (pt.periode = 'trimestre' AND n BETWEEN 0 AND 3)
    OR (pt.periode = 'an'        AND n = 0)
)
AND (
    CASE
        WHEN pt.periode = 'mois' THEN DATE_ADD(u.date_inscription, INTERVAL n MONTH)
        WHEN pt.periode = 'trimestre' THEN DATE_ADD(u.date_inscription, INTERVAL n*3 MONTH)
        WHEN pt.periode = 'an' THEN DATE_ADD(u.date_inscription, INTERVAL n YEAR)
    END
) <= '2026-08-31';
