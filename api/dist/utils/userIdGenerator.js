import crypto from 'crypto';
export class UserIdGenerator {
    static PREFIX = 'USR';
    static SECRET_SALT = process.env.USER_ID_SALT || 'ClubManager2024SecretSalt';
    /**
     * Génère un userId unique basé sur les données personnelles
     */
    static generateUserId(userData, attempt = 0) {
        console.log('[UserIdGenerator] === DÉBUT GÉNÉRATION USERID ===');
        console.log('[UserIdGenerator] Données reçues:', userData);
        console.log('[UserIdGenerator] Tentative n°:', attempt);
        console.log('[UserIdGenerator] Clés disponibles:', Object.keys(userData || {}));
        // 🔧 CORRIGÉ: Validation stricte des champs requis
        const prenom = userData.prenom;
        const nom = userData.nom;
        const dateNaissance = userData.date_naissance;
        const email = userData.email;
        console.log('[UserIdGenerator] Extraction des champs:', {
            prenom,
            nom,
            dateNaissance,
            email
        });
        // 🔧 CORRIGÉ: Validation avec messages d'erreur plus précis
        if (!prenom || typeof prenom !== 'string' || prenom.trim() === '') {
            console.error('[UserIdGenerator] ERREUR: Prénom manquant ou invalide:', prenom);
            throw new Error(`Prénom manquant ou invalide: "${prenom}"`);
        }
        if (!nom || typeof nom !== 'string' || nom.trim() === '') {
            console.error('[UserIdGenerator] ERREUR: Nom manquant ou invalide:', nom);
            throw new Error(`Nom manquant ou invalide: "${nom}"`);
        }
        if (!dateNaissance || typeof dateNaissance !== 'string' || dateNaissance.trim() === '') {
            console.error('[UserIdGenerator] ERREUR: Date de naissance manquante ou invalide:', dateNaissance);
            throw new Error(`Date de naissance manquante ou invalide: "${dateNaissance}"`);
        }
        if (!email || typeof email !== 'string' || email.trim() === '') {
            console.error('[UserIdGenerator] ERREUR: Email manquant ou invalide:', email);
            throw new Error(`Email manquant ou invalide: "${email}"`);
        }
        console.log('[UserIdGenerator] ✅ Validation réussie, génération de l\'userId...');
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        // Normaliser les données personnelles avec des vérifications
        const normalizedData = {
            prenom: prenom.trim().toUpperCase().replace(/\s+/g, ''),
            nom: nom.trim().toUpperCase().replace(/\s+/g, ''),
            dateNaissance: dateNaissance.replace(/-/g, ''),
            emailPrefix: email.split('@')[0].slice(0, 3).toUpperCase()
        };
        console.log('[UserIdGenerator] Données normalisées:', normalizedData);
        // Créer le salt personnalisé
        const personalSalt = crypto
            .createHash('sha256')
            .update([
            normalizedData.prenom,
            normalizedData.nom,
            normalizedData.dateNaissance,
            normalizedData.emailPrefix,
            this.SECRET_SALT,
            Date.now().toString(),
            attempt.toString()
        ].join('|'))
            .digest('hex');
        console.log('[UserIdGenerator] Salt généré (4 premiers caractères):', personalSalt.substring(0, 4));
        // Extraire une partie du hash pour l'ID
        const hashPart = personalSalt.substring(0, 4).toUpperCase();
        // Construire l'userId final
        let userId = `${this.PREFIX}${currentYear}${hashPart}${currentMonth}`;
        // Ajouter un suffixe si c'est une tentative supplémentaire
        if (attempt > 0) {
            userId += String(attempt).padStart(2, '0');
        }
        console.log('[UserIdGenerator] ✅ UserId généré:', userId);
        console.log('[UserIdGenerator] === FIN GÉNÉRATION USERID ===');
        return userId;
    }
    /**
     * Génère un userId court (plus lisible)
     */
    static generateShortUserId(userData, attempt = 0) {
        // Support both French and English field names
        const prenom = userData.prenom || userData.first_name;
        const nom = userData.nom || userData.last_name;
        const dateNaissance = userData.date_naissance || userData.date_of_birth;
        // Validation des données d'entrée
        if (!prenom || !nom || !dateNaissance) {
            throw new Error('Données utilisateur incomplètes pour la génération de l\'userId court');
        }
        const currentYear = String(new Date().getFullYear()).slice(-2); // 2 derniers chiffres
        // Initiales + date de naissance (année) + hash court
        const initiales = (prenom[0] + nom[0]).toUpperCase();
        const birthYear = dateNaissance.split('-')[0].slice(-2);
        const miniHash = crypto
            .createHash('md5')
            .update([
            prenom,
            nom,
            dateNaissance,
            this.SECRET_SALT,
            attempt.toString()
        ].join(''))
            .digest('hex')
            .substring(0, 3)
            .toUpperCase();
        let userId = `${initiales}${birthYear}${currentYear}${miniHash}`;
        if (attempt > 0) {
            userId += String(attempt);
        }
        return userId;
    }
    /**
     * Valide le format d'un userId
     */
    static validateUserIdFormat(userId) {
        // Format: USR + 4 chiffres année + 4 caractères hash + 2 chiffres mois + optionnel suffix
        const longFormat = /^USR\d{4}[A-F0-9]{4}\d{2}(\d{2})?$/;
        // Format court: 2 lettres + 4 chiffres + 3 caractères hash + optionnel chiffre
        const shortFormat = /^[A-Z]{2}\d{4}[A-F0-9]{3}\d?$/;
        return longFormat.test(userId) || shortFormat.test(userId);
    }
}
