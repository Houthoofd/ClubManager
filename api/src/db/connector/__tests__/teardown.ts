/**
 * Teardown global pour les tests du connector
 * Ce fichier ferme proprement le pool MySQL après tous les tests
 */

import MysqlConnector from "../mysqlconnector.js";

afterAll(async () => {
  try {
    const connector = MysqlConnector.getInstance();
    await connector.closePool();
    console.log("🔒 Pool MySQL fermé proprement après les tests du connector");
  } catch (error) {
    // Ignorer les erreurs si le pool est déjà fermé
    console.log("ℹ️  Pool MySQL déjà fermé ou non disponible");
  }
});
