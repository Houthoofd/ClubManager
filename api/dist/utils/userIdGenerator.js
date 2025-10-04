import crypto from 'crypto';
export class UserIdGenerator {
    static PREFIX = 'USR';
    static SECRET_SALT = process.env.USER_ID_SALT || 'ClubManager2024SecretSalt';
    /**
     * Génère un userId unique basé sur les données personnelles
     */
    static generateUserId(userData, attempt = 0) {
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        // Normaliser les données personnelles
        const normalizedData = {
            prenom: userData.prenom.trim().toUpperCase().replace(/\s+/g, ''),
            nom: userData.nom.trim().toUpperCase().replace(/\s+/g, ''),
            dateNaissance: userData.date_naissance.replace(/-/g, ''),
            emailPrefix: userData.email.split('@')[0].slice(0, 3).toUpperCase()
        };
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
        // Extraire une partie du hash pour l'ID
        const hashPart = personalSalt.substring(0, 4).toUpperCase();
        // Construire l'userId final
        let userId = `${this.PREFIX}${currentYear}${hashPart}${currentMonth}`;
        // Ajouter un suffixe si c'est une tentative supplémentaire
        if (attempt > 0) {
            userId += String(attempt).padStart(2, '0');
        }
        return userId;
    }
    /**
     * Génère un userId court (plus lisible)
     */
    static generateShortUserId(userData, attempt = 0) {
        const currentYear = String(new Date().getFullYear()).slice(-2); // 2 derniers chiffres
        // Initiales + date de naissance (année) + hash court
        const initiales = (userData.prenom[0] + userData.nom[0]).toUpperCase();
        const birthYear = userData.date_naissance.split('-')[0].slice(-2);
        const miniHash = crypto
            .createHash('md5')
            .update([
            userData.prenom,
            userData.nom,
            userData.date_naissance,
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
