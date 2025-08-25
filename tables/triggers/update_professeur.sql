DELIMITER //

-- 1️⃣ Trigger après INSERT dans utilisateurs
CREATE TRIGGER ajouter_professeur_apres_insert
AFTER INSERT ON utilisateurs
FOR EACH ROW
BEGIN
    IF NEW.status_id = 5 THEN
        -- Insérer dans professeurs si status_id = 5 et pas déjà présent (email unique)
        IF NOT EXISTS (
            SELECT 1 FROM professeurs WHERE email = NEW.email
        ) THEN
            INSERT INTO professeurs (nom, prenom, email, grade_id, status_id)
            VALUES (NEW.last_name, NEW.first_name, NEW.email, NEW.grade_id, NEW.status_id);
        END IF;
    END IF;
END;
//

-- 2️⃣ Trigger après UPDATE dans utilisateurs
CREATE TRIGGER maj_professeur_apres_update
AFTER UPDATE ON utilisateurs
FOR EACH ROW
BEGIN
    -- 1️⃣ Supprimer l'ancien en cas de changement d'email ou de status_id <> 5
    IF OLD.status_id = 5 AND (NEW.status_id <> 5 OR OLD.email <> NEW.email) THEN
        DELETE FROM professeurs WHERE email = OLD.email;
    END IF;

    -- 2️⃣ Ajouter ou mettre à jour si status_id = 5
    IF NEW.status_id = 5 THEN
        IF EXISTS (
            SELECT 1 FROM professeurs WHERE email = NEW.email
        ) THEN
            -- Mettre à jour les informations si déjà présent
            UPDATE professeurs
            SET nom = NEW.last_name,
                prenom = NEW.first_name,
                grade_id = NEW.grade_id,
                status_id = NEW.status_id
            WHERE email = NEW.email;
        ELSE
            -- Insérer si pas présent
            INSERT INTO professeurs (nom, prenom, email, grade_id, status_id)
            VALUES (NEW.last_name, NEW.first_name, NEW.email, NEW.grade_id, NEW.status_id);
        END IF;
    END IF;
END;
//

DELIMITER ;
