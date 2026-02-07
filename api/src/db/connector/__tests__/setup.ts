/**
 * Setup et teardown pour les tests du connector MySQL
 */

import MysqlConnector from "../mysqlconnector.js";

// Après tous les tests du connector, fermer le pool
afterAll(async () => {
  try {
    const connector = MysqlConnector.getInstance();
    if (connector && typeof connector.closePool === 'function') {
      await connector.closePool();
      console.log("🔒 Pool MySQL fermé proprement");
    }
  } catch (error) {
    // Ignorer les erreurs - le pool est peut-être déjà fermé
  }
});
