export default class Client {
    VerificationUtilisateur(sql: string, values: any[]): Promise<any>;
    Insert(sql: string, values: any[]): Promise<any>;
    query(sql: string, values?: any[]): Promise<any>;
}
