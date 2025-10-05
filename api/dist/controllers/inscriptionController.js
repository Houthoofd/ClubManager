import { userInscriptionSchema } from '../validators/userValidators.js';
import { InscriptionService } from '../services/inscriptionService.js';
export class InscriptionController {
    inscriptionService;
    constructor() {
        this.inscriptionService = new InscriptionService();
    }
    // Méthode pour inscrire un utilisateur avec email
    async inscrireUtilisateur(req, res) {
        try {
            console.log('🚀 [InscriptionController] Inscription utilisateur:', req.body.email);
            // Validation avec le schéma Zod
            const validationResult = userInscriptionSchema.safeParse(req.body);
            if (!validationResult.success) {
                console.error('❌ [InscriptionController] Validation échouée:', validationResult.error.issues);
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    errors: validationResult.error.issues
                });
            }
            const userData = validationResult.data;
            // Appeler la méthode d'inscription avec email
            const result = await this.inscriptionService.inscrireUtilisateur(userData);
            // Préparer la réponse
            const response = {
                success: result.success,
                message: result.message,
                generatedUserId: result.generatedUserId,
                emailStatus: result.emailStatus
            };
            // Log du résultat
            console.log('✅ [InscriptionController] Inscription réussie:', {
                userId: result.generatedUserId,
                email: userData.email,
                emailSent: result.emailStatus?.sent
            });
            res.status(201).json(response);
        }
        catch (error) {
            console.error('❌ [InscriptionController] Erreur inscription:', error);
            // Gestion spécifique des erreurs
            if (error.message && error.message.includes('USER_EXISTS')) {
                return res.status(409).json({
                    success: false,
                    message: 'Un utilisateur avec ces informations existe déjà',
                    error: 'USER_EXISTS'
                });
            }
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({
                    success: false,
                    message: 'Cette adresse email est déjà utilisée',
                    error: 'EMAIL_EXISTS'
                });
            }
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}
