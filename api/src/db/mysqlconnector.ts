import mysql from 'mysql';

export default class MysqlConnector {
  private connection: mysql.Connection;

  constructor() {
      // Configuration de la connexion à la base de données MySQL
      this.connection = mysql.createConnection({
        host: 'localhost', // Remplacez par votre endpoint RDS
        port: 3306, // Le port par défaut pour MySQL
        user: 'root', // Remplacez par votre nom d'utilisateur RDS
        password: '', // Remplacez par votre mot de passe RDS
        database: 'octopus_jjb',
      });

      // Établir la connexion à la base de données
      this.connection.connect((err) => {
          if (err) {
              console.error('Erreur de connexion à la base de données : ' + err.stack);
              return;
          }
          console.log('Connecté à la base de données MySQL avec l\'ID : ' + this.connection.threadId);
      });
  }

  public query(sql: string, values: any[], callback: (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]) => void): void {
    // Exécuter la requête SQL avec les valeurs échappées
    this.connection.query(sql, values, (error, results, fields) => {
        callback(error, results, fields);
    });
}

  public close(): void {
      // Fermer la connexion à la base de données
      this.connection.end((err) => {
          if (err) {
              console.error('Erreur lors de la fermeture de la connexion : ' + err.stack);
              return;
          }
          console.log('Connexion à la base de données MySQL fermée');
      });
  }
}