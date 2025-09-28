import MysqlConnector from '../db/connector/mysqlconnector.js';
export async function retryQuery(query, params = [], maxRetries = 3) {
    const mysqlConnector = MysqlConnector.getInstance();
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Tentative ${attempt}/${maxRetries} pour la requête`);
            const result = await mysqlConnector.query(query, params);
            return result;
        }
        catch (error) {
            console.error(`❌ Échec tentative ${attempt}:`, error.message);
            if (attempt === maxRetries) {
                throw error;
            }
            // Attendre avant de retry (backoff exponentiel)
            const delay = Math.pow(2, attempt) * 1000;
            console.log(`⏳ Attente de ${delay}ms avant retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Toutes les tentatives ont échoué');
}
