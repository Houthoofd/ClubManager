import type { CoursData, Utilisateur } from './cours.js';
export interface InsertResult {
    insertId: number;
    affectedRows: number;
}
export interface VerifyResult {
    isFind: boolean;
    message: string;
}
export interface VerifyResultWithData<T = any> extends VerifyResult {
    data: T;
}
export interface Book<T = any> {
    isBooked: boolean;
    message: string;
    data: T;
}
export type BookResult<T = any> = Book<T> & VerifyResult;
export interface ConfirmationResult {
    isConfirm: boolean;
    message: string;
}
export type CoursApiResponse = {
    success: boolean;
    data: {
        Cours: CoursData;
    };
    message: string;
};
export type UtilisateurApiResponse = VerifyResultWithData<{
    utilisateurs: Utilisateur[];
}>;
//# sourceMappingURL=query.d.ts.map