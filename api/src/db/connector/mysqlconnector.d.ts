import mysql from 'mysql';
export default class MysqlConnector {
    private connection;
    constructor();
    query(sql: string, values: any[], callback: (error: mysql.MysqlError | null, results?: any, fields?: mysql.FieldInfo[]) => void): void;
    close(): void;
}
