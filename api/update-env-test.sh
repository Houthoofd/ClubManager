#!/bin/bash

echo "========================================"
echo "Mise à jour du fichier .env.test"
echo "========================================"
echo ""

# Sauvegarde de l'ancien fichier
if [ -f .env.test ]; then
    cp .env.test .env.test.backup
    echo "✓ Sauvegarde créée: .env.test.backup"
fi

# Fusionner l'ancien et le nouveau (sans dupliquer)
if [ -f .env.test ]; then
    echo "✓ Fichier .env.test existant trouvé"
    echo ""
    echo "Ajout des variables manquantes..."
    
    # Ajouter uniquement les variables qui n'existent pas
    grep "^STRIPE_SECRET_KEY=" .env.test > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "" >> .env.test
        echo "# Stripe (ajouté automatiquement)" >> .env.test
        echo "STRIPE_SECRET_KEY=sk_test_mock_key_for_testing_only_do_not_use_in_production_12345" >> .env.test
        echo "  ✓ STRIPE_SECRET_KEY ajouté"
    fi
    
    grep "^EMAIL_USER=" .env.test > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "" >> .env.test
        echo "# Email (ajouté automatiquement)" >> .env.test
        echo "EMAIL_USER=test@clubmanager.local" >> .env.test
        echo "EMAIL_PASS=test_password_for_email_service" >> .env.test
        echo "  ✓ EMAIL_USER et EMAIL_PASS ajoutés"
    fi
    
    grep "^EMAIL_FROM=" .env.test > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "EMAIL_FROM=noreply@clubmanager.local" >> .env.test
        echo "  ✓ EMAIL_FROM ajouté"
    fi
    
    grep "^EMAIL_HOST=" .env.test > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "EMAIL_HOST=smtp.test.local" >> .env.test
        echo "EMAIL_PORT=587" >> .env.test
        echo "  ✓ EMAIL_HOST et EMAIL_PORT ajoutés"
    fi
    
    grep "^STRIPE_PUBLISHABLE_KEY=" .env.test > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "STRIPE_PUBLISHABLE_KEY=pk_test_mock_key_for_testing_only" >> .env.test
        echo "  ✓ STRIPE_PUBLISHABLE_KEY ajouté"
    fi
    
    grep "^JWT_EXPIRES_IN=" .env.test > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        echo "JWT_EXPIRES_IN=1h" >> .env.test
        echo "REFRESH_TOKEN_EXPIRES_IN=7d" >> .env.test
        echo "  ✓ JWT_EXPIRES_IN et REFRESH_TOKEN_EXPIRES_IN ajoutés"
    fi
    
else
    # Créer un nouveau fichier depuis le template complet
    echo "✓ Création d'un nouveau fichier .env.test"
    cp .env.test.COMPLET .env.test
fi

echo ""
echo "========================================"
echo "✓ Mise à jour terminée!"
echo "========================================"
echo ""
echo "Fichier créé: .env.test"
echo "Fichier de référence: .env.test.COMPLET"
echo ""
echo "Prochaine étape:"
echo "  npm run test:confirmation:unit"
