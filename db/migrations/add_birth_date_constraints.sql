-- Contraintes de base de données pour la date de naissance
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_not_future 
CHECK (date_naissance < CURDATE());

ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_min_age 
CHECK (DATEDIFF(CURDATE(), date_naissance) >= 1825); -- 5 ans minimum (5*365)

ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_max_age 
CHECK (DATEDIFF(CURDATE(), date_naissance) <= 36500); -- 100 ans maximum (100*365)

ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_min_year 
CHECK (YEAR(date_naissance) >= 1900);
