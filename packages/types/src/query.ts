export interface InsertResult {
  insertId: number;
  affectedRows: number;
}

export interface VerifyResult {
  isFind: boolean;
  message: string;
}