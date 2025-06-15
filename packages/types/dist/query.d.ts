export interface InsertResult {
    insertId: number;
    affectedRows: number;
}
export interface VerifyResult {
    isFind: boolean;
    message: string;
}
export interface VerifyResultWithData {
    isFind: boolean;
    message: string;
    data: any;
}
export interface Book {
    isBooked: boolean;
    message: string;
    data: any;
}
export interface ConfirmationResult {
    isConfirm: boolean;
    message: string;
}
export type BookResult = Book & VerifyResult;
//# sourceMappingURL=query.d.ts.map