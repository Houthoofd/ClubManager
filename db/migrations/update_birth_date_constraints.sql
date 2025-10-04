-- Suppression des anciennes contraintes si elles existent
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_birth_date_not_future;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_birth_date_min_age;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_birth_date_max_age;
ALTER TABLE utilisateurs DROP CONSTRAINT IF EXISTS chk_birth_date_min_year;

-- Nouvelles contraintes renforcées pour l'âge minimum de 5 ans
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_not_future 
CHECK (date_naissance < CURDATE());

-- Contrainte stricte: 5 ans minimum (1826 jours pour tenir compte des années bissextiles)
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_min_age_5_years 
CHECK (DATEDIFF(CURDATE(), date_naissance) >= 1826);

-- Contrainte maximum: 100 ans
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_max_age_100_years 
CHECK (DATEDIFF(CURDATE(), date_naissance) <= 36525);

-- Contrainte année minimum: 1900
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_min_year_1900 
CHECK (YEAR(date_naissance) >= 1900);

-- Contrainte supplémentaire: pas de naissance le jour même
ALTER TABLE utilisateurs 
ADD CONSTRAINT chk_birth_date_not_today 
CHECK (date_naissance < CURDATE());
