#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'extraction automatique des tables SQL
Extrait chaque table du fichier clubmanager.sql vers des fichiers individuels
"""

import os
import re

# Configuration
SOURCE_FILE = "../creation/clubmanager.sql"
OUTPUT_BASE = "./tables"

# Mapping des tables vers leurs catégories
TABLE_MAPPING = {
    # REFERENCE
    "genres": "reference",
    "grades": "reference",
    "status": "reference",
    "plans_tarifaires": "reference",
    "categories": "reference",
    "tailles": "reference",
    # USERS
    "utilisateurs": "users",
    "email_validation_tokens": "users",
    "password_reset_tokens": "users",
    "password_reset_attempts": "users",
    "auth_attempts": "users",
    "manual_recovery_requests": "users",
    "validation_tokens": "users",
    # COURSES
    "cours_recurrent": "courses",
    "cours": "courses",
    "professeurs": "courses",
    "cours_recurrent_professeur": "courses",
    "inscriptions": "courses",
    "reservations": "courses",
    # PAYMENTS
    "paiements": "payments",
    "echeances_paiements": "payments",
    # STORE
    "articles": "store",
    "images": "store",
    "stocks": "store",
    "commandes": "store",
    "commande_articles": "store",
    # MESSAGING
    "messages": "messaging",
    "message_status": "messaging",
    "types_messages_personnalises": "messaging",
    "messages_personnalises": "messaging",
    "notifications": "messaging",
    # ALERTS
    "alertes_types": "alerts",
    "alertes_utilisateurs": "alerts",
    "alertes_actions": "alerts",
    # GROUPS
    "groupes": "groups",
    "groupes_utilisateurs": "groups",
    # SYSTEM
    "statistiques": "system",
    "informations": "system",
}

# Tables à ignorer
SKIP_TABLES = ["sms_recovery_codes"]


def extract_table_definition(content, table_name, start_idx):
    """Extrait la définition complète d'une table"""
    lines = content[start_idx:].split("\n")

    table_content = []
    in_table = False
    trigger_count = 0

    for line in lines:
        # Début de la table
        if (
            f"CREATE TABLE `{table_name}`" in line
            or f"CREATE TABLE IF NOT EXISTS `{table_name}`" in line
        ):
            in_table = True
            table_content.append(line)
            continue

        if in_table:
            table_content.append(line)

            # Détecter les triggers
            if "CREATE TRIGGER" in line:
                trigger_count += 1

            # Fin de section trigger
            if trigger_count > 0 and "DELIMITER ;" in line:
                trigger_count -= 1
                if trigger_count == 0:
                    continue

            # Fin de la définition de table (prochain séparateur ou prochaine table)
            if "-- --------------------------------------------------------" in line:
                # Vérifier si c'est vraiment la fin ou juste un séparateur interne
                next_lines = "\n".join(
                    lines[len(table_content) : len(table_content) + 5]
                )
                if (
                    "CREATE TABLE" in next_lines
                    or "Tabelstructuur voor tabel" in next_lines
                ):
                    break

    return "\n".join(table_content)


def create_table_file(table_name, category, content):
    """Crée un fichier SQL pour une table"""

    # Descriptions des domaines
    domain_desc = {
        "reference": "Référence",
        "users": "Utilisateurs",
        "courses": "Cours",
        "payments": "Paiements",
        "store": "Magasin",
        "messaging": "Messagerie",
        "alerts": "Alertes",
        "groups": "Groupes",
        "system": "Système",
    }

    # Header du fichier
    header = f"""-- ============================================================================
-- TABLE: {table_name}
-- ============================================================================
-- Description: {get_table_description(table_name)}
-- Domaine: {domain_desc.get(category, category)}
-- ============================================================================

"""

    # Footer
    footer = """
-- ============================================================================
-- FIN DE LA DÉFINITION
-- ============================================================================
"""

    # Créer le dossier si nécessaire
    output_dir = os.path.join(OUTPUT_BASE, category)
    os.makedirs(output_dir, exist_ok=True)

    # Écrire le fichier
    output_path = os.path.join(output_dir, f"{table_name}.sql")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header)
        f.write(content)
        f.write(footer)

    print(f"✓ {table_name}.sql → {category}/")


def get_table_description(table_name):
    """Retourne une description de la table"""
    descriptions = {
        "genres": "Gestion des genres (Masculin, Féminin)",
        "grades": "Grades de jiu-jitsu (ceintures)",
        "status": "Statuts généraux du système",
        "plans_tarifaires": "Plans d'abonnement et tarifs",
        "categories": "Catégories d'articles du magasin",
        "tailles": "Tailles disponibles pour les articles",
        "utilisateurs": "Table principale des utilisateurs",
        "email_validation_tokens": "Tokens de validation email et récupération",
        "password_reset_tokens": "Tokens de réinitialisation mot de passe",
        "password_reset_attempts": "Historique des tentatives de reset",
        "auth_attempts": "Tentatives de connexion (brute force protection)",
        "manual_recovery_requests": "Demandes de récupération manuelle",
        "validation_tokens": "Tokens de validation génériques",
        "cours_recurrent": "Cours récurrents hebdomadaires",
        "cours": "Instances de cours générées",
        "professeurs": "Professeurs et instructeurs",
        "cours_recurrent_professeur": "Association cours-professeurs",
        "inscriptions": "Inscriptions aux cours",
        "reservations": "Réservations de cours",
        "paiements": "Historique des paiements",
        "echeances_paiements": "Échéances de paiement",
        "articles": "Articles du magasin",
        "images": "Images des articles",
        "stocks": "Gestion des stocks",
        "commandes": "Commandes des utilisateurs",
        "commande_articles": "Lignes de commande",
        "messages": "Messages entre utilisateurs",
        "message_status": "Statuts de messages",
        "types_messages_personnalises": "Types de messages personnalisés",
        "messages_personnalises": "Templates de messages",
        "notifications": "Notifications système",
        "alertes_types": "Types d'alertes",
        "alertes_utilisateurs": "Alertes utilisateurs",
        "alertes_actions": "Historique des actions sur alertes",
        "groupes": "Groupes d'utilisateurs",
        "groupes_utilisateurs": "Association utilisateurs-groupes",
        "statistiques": "Statistiques du club",
        "informations": "Informations générales du club",
    }
    return descriptions.get(table_name, "Table de données")


def main():
    print("=" * 80)
    print("EXTRACTION DES TABLES SQL")
    print("=" * 80)
    print()

    # Lire le fichier source
    print(f"Lecture du fichier: {SOURCE_FILE}")
    with open(SOURCE_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    print(f"Taille du fichier: {len(content)} caractères")
    print()

    # Extraire chaque table
    extracted = 0
    skipped = 0

    for table_name, category in TABLE_MAPPING.items():
        if table_name in SKIP_TABLES:
            print(f"⊗ {table_name} (ignorée)")
            skipped += 1
            continue

        # Chercher la table
        pattern = f"CREATE TABLE (`{table_name}`|IF NOT EXISTS `{table_name}`)"
        match = re.search(pattern, content)

        if match:
            start_idx = match.start()
            table_content = extract_table_definition(content, table_name, start_idx)
            create_table_file(table_name, category, table_content)
            extracted += 1
        else:
            print(f"✗ {table_name} (non trouvée)")

    print()
    print("=" * 80)
    print(f"Extraction terminée: {extracted} tables extraites, {skipped} ignorées")
    print("=" * 80)


if __name__ == "__main__":
    main()
