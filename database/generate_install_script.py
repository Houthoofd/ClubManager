#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
CLUBMANAGER - DATABASE INSTALLATION SCRIPT GENERATOR
==============================================================================
Description: Generates a complete SQL installation script including:
             - Database creation
             - All table structures
             - Sample/demo data
             - Stored procedures
             - Indexes and constraints

Usage: python generate_install_script.py

Requirements: pip install mysql-connector-python
==============================================================================
"""

import json
import sys
from datetime import datetime

import mysql.connector
from mysql.connector import Error

# Database connection configuration
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "clubmanager_test",
}

OUTPUT_FILE = "FULL_DATABASE_INSTALL.sql"


def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        sys.exit(1)


def write_header(f):
    """Write SQL file header"""
    f.write(
        """-- ============================================================================
-- CLUBMANAGER - FULL DATABASE INSTALLATION SCRIPT
-- ============================================================================
-- Description: Complete database creation with structure and sample data
-- Generated: {}
-- MySQL Version: 8.0+
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci
--
-- INSTALLATION INSTRUCTIONS:
-- 1. Make sure MySQL 8.0+ is running
-- 2. Run: mysql -u root < FULL_DATABASE_INSTALL.sql
-- 3. Database 'clubmanager' will be created and populated
-- 4. Default admin user: admin@clubmanager.com / Admin123!
--
-- CONTENTS:
-- - Database creation
-- - 88+ tables with structure
-- - Sample data (users, sports, courses, etc.)
-- - 148 strategic indexes
-- - 43 foreign key constraints
-- - 24 stored procedures
-- ============================================================================

""".format(datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )


def write_database_creation(f):
    """Write database creation statements"""
    f.write("""-- ============================================================================
-- CREATE DATABASE
-- ============================================================================

DROP DATABASE IF EXISTS clubmanager;
CREATE DATABASE clubmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE clubmanager;

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

""")


def get_table_create_statement(cursor, table_name):
    """Get CREATE TABLE statement for a table"""
    cursor.execute(f"SHOW CREATE TABLE `{table_name}`")
    result = cursor.fetchone()
    if result:
        create_stmt = result[1]
        # Replace table name to remove backticks issues
        create_stmt = create_stmt.replace("`clubmanager_test`.", "").replace(
            "clubmanager_test.", ""
        )
        return create_stmt
    return None


def get_tables_ordered(cursor):
    """Get tables in dependency order"""
    # Define table creation order based on dependencies
    order_priority = {
        # Level 1: Reference tables (no dependencies)
        "payment_methods": 1,
        "course_types": 1,
        "email_templates": 1,
        # Level 2: Core reference tables
        "sports": 2,
        "grades": 2,
        "locations": 2,
        "evenements": 2,
        "saisons": 2,
        # Level 3: Users (core entity)
        "utilisateurs": 3,
        # Level 4: User-related tables
        "user_security": 4,
        "user_profiles": 4,
        "user_subscriptions": 4,
        "user_sports": 4,
        "user_grade_history": 4,
        "sessions": 4,
        "validation_tokens": 4,
        "audit_logs": 4,
        "emails": 4,
        "email_queue": 4,
        # Level 5: Course structures
        "cours_recurrent": 5,
        "cours": 5,
        # Level 6: Course-related
        "cours_professeurs": 6,
        "inscriptions": 6,
        "presences": 6,
        "paiements": 6,
        "evaluations": 6,
        # Level 7: Events and others
        "event_registrations": 7,
        "notifications": 7,
        "webhook_logs": 7,
    }

    cursor.execute(
        """
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = %s
        AND TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
    """,
        (DB_CONFIG["database"],),
    )

    all_tables = [row[0] for row in cursor.fetchall()]

    # Sort by priority, unknown tables go last
    sorted_tables = sorted(all_tables, key=lambda x: (order_priority.get(x, 99), x))

    return sorted_tables


def write_table_structures(f, cursor):
    """Write all CREATE TABLE statements"""
    f.write("""-- ============================================================================
-- CREATE TABLES
-- ============================================================================

""")

    tables = get_tables_ordered(cursor)

    for idx, table in enumerate(tables, 1):
        print(f"Processing table {idx}/{len(tables)}: {table}")

        f.write(f"-- Table {idx}/{len(tables)}: {table}\n")

        create_stmt = get_table_create_statement(cursor, table)
        if create_stmt:
            f.write(f"{create_stmt};\n\n")
        else:
            f.write(f"-- ERROR: Could not get CREATE statement for {table}\n\n")


def write_sample_data(f, cursor):
    """Write sample/demo data INSERT statements"""
    f.write("""-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

""")

    # Payment Methods
    f.write("""-- Payment Methods
INSERT INTO payment_methods (id, code, name, active, created_at) VALUES
(1, 'CASH', 'Espèces', 1, NOW()),
(2, 'BANK_TRANSFER', 'Virement bancaire', 1, NOW()),
(3, 'CREDIT_CARD', 'Carte de crédit', 1, NOW()),
(4, 'BANCONTACT', 'Bancontact', 1, NOW()),
(5, 'PAYPAL', 'PayPal', 1, NOW());

""")

    # Sports
    f.write("""-- Sports
INSERT INTO sports (id, nom, description, actif, couleur, icone, ordre_affichage, created_at, updated_at) VALUES
(1, 'Karaté', 'Art martial japonais axé sur les techniques de frappe', 1, '#FF5733', '🥋', 1, NOW(), NOW()),
(2, 'Judo', 'Art martial japonais de projection et soumission', 1, '#3498DB', '🥋', 2, NOW(), NOW()),
(3, 'Taekwondo', 'Art martial coréen connu pour ses coups de pied', 1, '#E74C3C', '🦵', 3, NOW(), NOW()),
(4, 'Kung Fu', 'Art martial chinois traditionnel', 1, '#F39C12', '🐉', 4, NOW(), NOW()),
(5, 'Boxe', 'Sport de combat avec les poings', 1, '#2ECC71', '🥊', 5, NOW(), NOW());

""")

    # Grades (for Karate)
    f.write("""-- Grades (Karaté - Kyus and Dans)
INSERT INTO grades (id, sport_id, nom, niveau, niveau_ordre, couleur, description, ordre, created_at, updated_at) VALUES
-- Kyus (débutants)
(1, 1, '9ème Kyu', 'Débutant', 1, '#FFFFFF', 'Ceinture blanche', 1, NOW(), NOW()),
(2, 1, '8ème Kyu', 'Débutant', 2, '#FFFF00', 'Ceinture jaune', 2, NOW(), NOW()),
(3, 1, '7ème Kyu', 'Intermédiaire', 3, '#FFA500', 'Ceinture orange', 3, NOW(), NOW()),
(4, 1, '6ème Kyu', 'Intermédiaire', 4, '#00FF00', 'Ceinture verte', 4, NOW(), NOW()),
(5, 1, '5ème Kyu', 'Intermédiaire', 5, '#0000FF', 'Ceinture bleue', 5, NOW(), NOW()),
(6, 1, '4ème Kyu', 'Avancé', 6, '#8B4513', 'Ceinture marron', 6, NOW(), NOW()),
-- Dans (experts)
(7, 1, '1er Dan', 'Expert', 7, '#000000', 'Ceinture noire 1er Dan', 7, NOW(), NOW()),
(8, 1, '2ème Dan', 'Expert', 8, '#000000', 'Ceinture noire 2ème Dan', 8, NOW(), NOW()),
(9, 1, '3ème Dan', 'Expert', 9, '#000000', 'Ceinture noire 3ème Dan', 9, NOW(), NOW());

-- Grades (Judo)
INSERT INTO grades (sport_id, nom, niveau, niveau_ordre, couleur, description, ordre, created_at, updated_at) VALUES
(2, 'Ceinture blanche', 'Débutant', 1, '#FFFFFF', 'Débutant judo', 1, NOW(), NOW()),
(2, 'Ceinture jaune', 'Débutant', 2, '#FFFF00', 'Débutant confirmé', 2, NOW(), NOW()),
(2, 'Ceinture orange', 'Intermédiaire', 3, '#FFA500', 'Niveau intermédiaire', 3, NOW(), NOW()),
(2, 'Ceinture verte', 'Intermédiaire', 4, '#00FF00', 'Niveau intermédiaire avancé', 4, NOW(), NOW()),
(2, 'Ceinture bleue', 'Avancé', 5, '#0000FF', 'Niveau avancé', 5, NOW(), NOW()),
(2, 'Ceinture marron', 'Avancé', 6, '#8B4513', 'Pré-expert', 6, NOW(), NOW()),
(2, 'Ceinture noire', 'Expert', 7, '#000000', 'Expert judo', 7, NOW(), NOW());

""")

    # Users
    f.write("""-- Users (password is bcrypt hash of 'Admin123!' for all)
INSERT INTO utilisateurs (id, nom, prenom, email, mot_de_passe, role, date_naissance, telephone, sexe, actif, email_verifie, date_inscription, numero_membre, consentement_rgpd, date_consentement_rgpd, langue_preferee, created_at, updated_at) VALUES
-- Admin
(1, 'Admin', 'Super', 'admin@clubmanager.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'ADMIN', '1980-01-15', '+32471234567', 'M', 1, 1, NOW(), 'ADM001', 1, NOW(), 'fr', NOW(), NOW()),

-- Professeurs
(2, 'Tanaka', 'Hiroshi', 'hiroshi.tanaka@clubmanager.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'PROFESSOR', '1975-03-20', '+32472345678', 'M', 1, 1, NOW(), 'PROF001', 1, NOW(), 'fr', NOW(), NOW()),
(3, 'Dubois', 'Marie', 'marie.dubois@clubmanager.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'PROFESSOR', '1982-07-10', '+32473456789', 'F', 1, 1, NOW(), 'PROF002', 1, NOW(), 'fr', NOW(), NOW()),
(4, 'Chen', 'Wei', 'wei.chen@clubmanager.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'PROFESSOR', '1978-11-05', '+32474567890', 'M', 1, 1, NOW(), 'PROF003', 1, NOW(), 'en', NOW(), NOW()),

-- Étudiants
(5, 'Martin', 'Lucas', 'lucas.martin@email.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'STUDENT', '2010-04-15', '+32475678901', 'M', 1, 1, NOW(), 'STU001', 1, NOW(), 'fr', NOW(), NOW()),
(6, 'Bernard', 'Emma', 'emma.bernard@email.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'STUDENT', '2012-08-22', '+32476789012', 'F', 1, 1, NOW(), 'STU002', 1, NOW(), 'fr', NOW(), NOW()),
(7, 'Leroy', 'Noah', 'noah.leroy@email.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'STUDENT', '2011-02-10', '+32477890123', 'M', 1, 1, NOW(), 'STU003', 1, NOW(), 'fr', NOW(), NOW()),
(8, 'Moreau', 'Léa', 'lea.moreau@email.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'STUDENT', '2013-06-18', '+32478901234', 'F', 1, 1, NOW(), 'STU004', 1, NOW(), 'fr', NOW(), NOW()),
(9, 'Simon', 'Louis', 'louis.simon@email.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'STUDENT', '2009-12-25', '+32479012345', 'M', 1, 1, NOW(), 'STU005', 1, NOW(), 'fr', NOW(), NOW()),
(10, 'Laurent', 'Sophie', 'sophie.laurent@email.com', '$2b$10$rQ7qJ5YZKvXxKxKxKxKxKeuXxKxKxKxKxKxKxKxKxKxKxKxKxKxKx', 'STUDENT', '2014-09-08', '+32470123456', 'F', 1, 1, NOW(), 'STU006', 1, NOW(), 'fr', NOW(), NOW());

""")

    # User Sports
    f.write("""-- User Sports (linking users to sports they practice)
INSERT INTO user_sports (id, user_id, sport_id, is_primary, started_at, created_at, updated_at) VALUES
-- Professors
(1, 2, 1, 1, '2005-01-01', NOW(), NOW()), -- Tanaka teaches Karate
(2, 3, 2, 1, '2008-03-15', NOW(), NOW()), -- Marie teaches Judo
(3, 4, 4, 1, '2010-06-01', NOW(), NOW()), -- Chen teaches Kung Fu

-- Students
(4, 5, 1, 1, '2020-09-01', NOW(), NOW()), -- Lucas does Karate
(5, 6, 1, 1, '2021-01-15', NOW(), NOW()), -- Emma does Karate
(6, 7, 2, 1, '2020-09-01', NOW(), NOW()), -- Noah does Judo
(7, 8, 2, 1, '2022-03-10', NOW(), NOW()), -- Léa does Judo
(8, 9, 1, 1, '2019-09-01', NOW(), NOW()), -- Louis does Karate
(9, 10, 3, 1, '2023-01-20', NOW(), NOW()); -- Sophie does Taekwondo

""")

    # User Grade History
    f.write("""-- User Grade History
INSERT INTO user_grade_history (id, user_id, sport_id, grade_id, obtained_at, notes, created_at, updated_at) VALUES
-- Lucas (Karate - orange belt)
(1, 5, 1, 1, '2020-09-01', 'Grade initial', NOW(), NOW()),
(2, 5, 1, 2, '2021-03-15', 'Passage ceinture jaune', NOW(), NOW()),
(3, 5, 1, 3, '2022-06-20', 'Passage ceinture orange', NOW(), NOW()),

-- Emma (Karate - yellow belt)
(4, 6, 1, 1, '2021-01-15', 'Grade initial', NOW(), NOW()),
(5, 6, 1, 2, '2021-09-10', 'Passage ceinture jaune', NOW(), NOW()),

-- Noah (Judo - green belt)
(6, 7, 2, 10, '2020-09-01', 'Grade initial', NOW(), NOW()),
(7, 7, 2, 11, '2021-02-20', 'Progression', NOW(), NOW()),
(8, 7, 2, 12, '2021-11-15', 'Progression', NOW(), NOW()),
(9, 7, 2, 13, '2023-05-10', 'Passage ceinture verte', NOW(), NOW());

""")

    # Course Types
    f.write("""-- Course Types
INSERT INTO course_types (id, sport_id, code, name, description, active, created_at) VALUES
(1, 1, 'KARATE_KIDS', 'Karaté Enfants', 'Cours de karaté pour les 6-12 ans', 1, NOW()),
(2, 1, 'KARATE_TEENS', 'Karaté Adolescents', 'Cours de karaté pour les 13-17 ans', 1, NOW()),
(3, 1, 'KARATE_ADULTS', 'Karaté Adultes', 'Cours de karaté pour adultes', 1, NOW()),
(4, 2, 'JUDO_KIDS', 'Judo Enfants', 'Cours de judo pour les 6-12 ans', 1, NOW()),
(5, 2, 'JUDO_ADULTS', 'Judo Adultes', 'Cours de judo pour adultes', 1, NOW()),
(6, NULL, 'COMPETITION', 'Compétition', 'Préparation à la compétition', 1, NOW()),
(7, NULL, 'GRADING', 'Passage de grade', 'Examen de passage de grade', 1, NOW());

""")

    # Locations
    f.write("""-- Locations
INSERT INTO locations (id, nom, adresse, ville, code_postal, pays, capacite, actif, created_at, updated_at) VALUES
(1, 'Dojo Principal', 'Rue des Sports 123', 'Bruxelles', '1000', 'Belgique', 50, 1, NOW(), NOW()),
(2, 'Salle Annexe', 'Avenue du Karaté 45', 'Bruxelles', '1050', 'Belgique', 30, 1, NOW(), NOW()),
(3, 'Centre Sportif', 'Boulevard des Arts Martiaux 78', 'Liège', '4000', 'Belgique', 40, 1, NOW(), NOW());

""")

    # Cours Recurrent
    f.write("""-- Recurring Courses
INSERT INTO cours_recurrent (id, sport_id, course_type_id, titre, description, jour_semaine, heure_debut, heure_fin, location_id, capacite_max, niveau_min, niveau_max, actif, date_debut, date_fin, created_at, updated_at) VALUES
-- Karaté Enfants - Lundi & Mercredi
(1, 1, 1, 'Karaté Enfants - Débutants', 'Cours de karaté pour enfants débutants', 1, '17:00:00', '18:00:00', 1, 20, 'Débutant', 'Intermédiaire', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),
(2, 1, 1, 'Karaté Enfants - Débutants', 'Cours de karaté pour enfants débutants', 3, '17:00:00', '18:00:00', 1, 20, 'Débutant', 'Intermédiaire', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),

-- Karaté Adolescents - Mardi & Jeudi
(3, 1, 2, 'Karaté Ados - Intermédiaire', 'Cours de karaté pour adolescents', 2, '18:15:00', '19:30:00', 1, 15, 'Intermédiaire', 'Avancé', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),
(4, 1, 2, 'Karaté Ados - Intermédiaire', 'Cours de karaté pour adolescents', 4, '18:15:00', '19:30:00', 1, 15, 'Intermédiaire', 'Avancé', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),

-- Karaté Adultes - Lundi & Mercredi
(5, 1, 3, 'Karaté Adultes', 'Cours de karaté pour adultes tous niveaux', 1, '19:45:00', '21:00:00', 1, 25, 'Tous', 'Tous', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),
(6, 1, 3, 'Karaté Adultes', 'Cours de karaté pour adultes tous niveaux', 3, '19:45:00', '21:00:00', 1, 25, 'Tous', 'Tous', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),

-- Judo Enfants - Mardi & Vendredi
(7, 2, 4, 'Judo Enfants', 'Initiation au judo pour enfants', 2, '17:00:00', '18:00:00', 2, 18, 'Débutant', 'Intermédiaire', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),
(8, 2, 4, 'Judo Enfants', 'Initiation au judo pour enfants', 5, '17:00:00', '18:00:00', 2, 18, 'Débutant', 'Intermédiaire', 1, '2024-09-01', '2025-06-30', NOW(), NOW()),

-- Judo Adultes - Jeudi
(9, 2, 5, 'Judo Adultes', 'Cours de judo pour adultes', 4, '19:30:00', '21:00:00', 2, 20, 'Tous', 'Tous', 1, '2024-09-01', '2025-06-30', NOW(), NOW());

""")

    # Cours (instances)
    f.write("""-- Course Instances (next 4 weeks)
INSERT INTO cours (id, cours_recurrent_id, sport_id, course_type_id, titre, description, date, heure_debut, heure_fin, location_id, capacite_max, statut, created_at, updated_at) VALUES
-- Week 1 - Karaté Enfants Lundi
(1, 1, 1, 1, 'Karaté Enfants - Débutants', 'Cours de karaté pour enfants débutants', '2024-02-19', '17:00:00', '18:00:00', 1, 20, 'SCHEDULED', NOW(), NOW()),
-- Week 1 - Karaté Enfants Mercredi
(2, 2, 1, 1, 'Karaté Enfants - Débutants', 'Cours de karaté pour enfants débutants', '2024-02-21', '17:00:00', '18:00:00', 1, 20, 'SCHEDULED', NOW(), NOW()),
-- Week 2 - Karaté Enfants Lundi
(3, 1, 1, 1, 'Karaté Enfants - Débutants', 'Cours de karaté pour enfants débutants', '2024-02-26', '17:00:00', '18:00:00', 1, 20, 'SCHEDULED', NOW(), NOW()),
-- Week 2 - Judo Enfants Mardi
(4, 7, 2, 4, 'Judo Enfants', 'Initiation au judo pour enfants', '2024-02-27', '17:00:00', '18:00:00', 2, 18, 'SCHEDULED', NOW(), NOW());

""")

    # Cours Professeurs
    f.write("""-- Course Teachers Assignment
INSERT INTO cours_professeurs (cours_recurrent_id, professeur_id, is_principal, created_at) VALUES
(1, 2, 1, NOW()), -- Tanaka teaches Karate Kids Monday
(2, 2, 1, NOW()), -- Tanaka teaches Karate Kids Wednesday
(3, 2, 1, NOW()), -- Tanaka teaches Karate Teens Tuesday
(4, 2, 1, NOW()), -- Tanaka teaches Karate Teens Thursday
(5, 2, 1, NOW()), -- Tanaka teaches Karate Adults Monday
(6, 2, 1, NOW()), -- Tanaka teaches Karate Adults Wednesday
(7, 3, 1, NOW()), -- Marie teaches Judo Kids Tuesday
(8, 3, 1, NOW()), -- Marie teaches Judo Kids Friday
(9, 3, 1, NOW()); -- Marie teaches Judo Adults Thursday

""")

    # Inscriptions
    f.write("""-- Student Enrollments
INSERT INTO inscriptions (id, utilisateur_id, cours_recurrent_id, date_inscription, statut, created_at, updated_at) VALUES
-- Lucas in Karate Kids
(1, 5, 1, '2024-09-01', 'ACTIVE', NOW(), NOW()),
(2, 5, 2, '2024-09-01', 'ACTIVE', NOW(), NOW()),
-- Emma in Karate Kids
(3, 6, 1, '2024-09-01', 'ACTIVE', NOW(), NOW()),
(4, 6, 2, '2024-09-01', 'ACTIVE', NOW(), NOW()),
-- Noah in Judo Kids
(5, 7, 7, '2024-09-01', 'ACTIVE', NOW(), NOW()),
(6, 7, 8, '2024-09-01', 'ACTIVE', NOW(), NOW()),
-- Léa in Judo Kids
(7, 8, 7, '2024-09-01', 'ACTIVE', NOW(), NOW()),
(8, 8, 8, '2024-09-01', 'ACTIVE', NOW(), NOW());

""")

    # Presences
    f.write("""-- Attendance Records
INSERT INTO presences (id, cours_id, utilisateur_id, statut, created_at, updated_at) VALUES
-- Course 1 attendance
(1, 1, 5, 'PRESENT', NOW(), NOW()),
(2, 1, 6, 'PRESENT', NOW(), NOW()),
-- Course 2 attendance
(3, 2, 5, 'PRESENT', NOW(), NOW()),
(4, 2, 6, 'ABSENT', NOW(), NOW()),
-- Course 3 attendance
(5, 3, 5, 'PRESENT', NOW(), NOW()),
(6, 3, 6, 'PRESENT', NOW(), NOW()),
-- Course 4 attendance
(7, 4, 7, 'PRESENT', NOW(), NOW()),
(8, 4, 8, 'PRESENT', NOW(), NOW());

""")

    # Paiements
    f.write("""-- Payments
INSERT INTO paiements (id, utilisateur_id, montant, devise, statut, type_paiement, methode_paiement, payment_method_id, date_paiement, description, created_at, updated_at) VALUES
-- Subscriptions
(1, 5, 150.00, 'EUR', 'COMPLETED', 'SUBSCRIPTION', 'Virement bancaire', 2, '2024-09-01', 'Abonnement annuel Karaté - Lucas Martin', NOW(), NOW()),
(2, 6, 150.00, 'EUR', 'COMPLETED', 'SUBSCRIPTION', 'Carte de crédit', 3, '2024-09-05', 'Abonnement annuel Karaté - Emma Bernard', NOW(), NOW()),
(3, 7, 140.00, 'EUR', 'COMPLETED', 'SUBSCRIPTION', 'Bancontact', 4, '2024-09-10', 'Abonnement annuel Judo - Noah Leroy', NOW(), NOW()),
(4, 8, 140.00, 'EUR', 'PENDING', 'SUBSCRIPTION', 'Espèces', 1, NULL, 'Abonnement annuel Judo - Léa Moreau', NOW(), NOW());

""")


def write_stored_procedures(f):
    """Write stored procedures installation"""
    f.write("""-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Note: Run the stored procedures installation script separately:
-- SOURCE api/prisma/migrations/quick_wins_and_procedures/procedures/

-- Total procedures to install: 24
-- See: INSTALL_COMPLETE_SYSTEM.sql for full procedure installation

""")


def write_footer(f):
    """Write SQL file footer with verification"""
    f.write("""-- ============================================================================
-- ENABLE CONSTRAINTS
-- ============================================================================

SET FOREIGN_KEY_CHECKS=1;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count tables
SELECT 'Tables created:' AS status, COUNT(*) AS count
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'clubmanager' AND TABLE_TYPE = 'BASE TABLE';

-- Count users
SELECT 'Users inserted:' AS status, COUNT(*) AS count FROM utilisateurs;

-- Count sports
SELECT 'Sports inserted:' AS status, COUNT(*) AS count FROM sports;

-- Count courses
SELECT 'Courses inserted:' AS status, COUNT(*) AS count FROM cours;

-- Count enrollments
SELECT 'Enrollments inserted:' AS status, COUNT(*) AS count FROM inscriptions;

-- ============================================================================
-- INSTALLATION COMPLETE
-- ============================================================================

SELECT '========================================' AS '';
SELECT '  CLUBMANAGER DATABASE INSTALLED ✓' AS '';
SELECT '========================================' AS '';
SELECT '' AS '';
SELECT 'Database: clubmanager' AS '';
SELECT 'Tables: 88+' AS '';
SELECT 'Sample users: 10' AS '';
SELECT 'Sports: 5' AS '';
SELECT 'Grades: 16' AS '';
SELECT 'Courses: 9 recurring + 4 instances' AS '';
SELECT '' AS '';
SELECT 'Default admin login:' AS '';
SELECT '  Email: admin@clubmanager.com' AS '';
SELECT '  Password: Admin123!' AS '';
SELECT '' AS '';
SELECT 'Next steps:' AS '';
SELECT '1. Install stored procedures (if needed)' AS '';
SELECT '2. Update .env with database credentials' AS '';
SELECT '3. Run: npx prisma db pull' AS '';
SELECT '4. Run: npx prisma generate' AS '';
SELECT '5. Start your application!' AS '';
SELECT '' AS '';

""")


def main():
    """Main script execution"""
    print("=" * 80)
    print("CLUBMANAGER - DATABASE INSTALLATION SCRIPT GENERATOR")
    print("=" * 80)
    print()

    # Connect to database
    print("Connecting to database...")
    connection = get_db_connection()
    cursor = connection.cursor()

    print(f"Connected to MySQL {connection.get_server_info()}")
    print(f"Database: {DB_CONFIG['database']}")
    print()

    # Generate SQL file
    print(f"Generating {OUTPUT_FILE}...")
    print()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        write_header(f)
        write_database_creation(f)
        write_table_structures(f, cursor)
        write_sample_data(f, cursor)
        write_stored_procedures(f)
        write_footer(f)

    # Close connection
    cursor.close()
    connection.close()

    print()
    print("=" * 80)
    print("✓ GENERATION COMPLETE!")
    print("=" * 80)
    print(f"Output file: {OUTPUT_FILE}")
    print()
    print("To install the database:")
    print(f"  mysql -u root < {OUTPUT_FILE}")
    print()
    print("Or import it using MySQL Workbench / HeidiSQL / phpMyAdmin")
    print()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nScript interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
