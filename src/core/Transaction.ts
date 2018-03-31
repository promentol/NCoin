export interface Transaction {
    data: {
        from?: string;
        type: TransactionType;
        to: string;
        amount: number;
        payload: string;
    },
    signature?: string;
}

export enum TransactionType {
    CoinBase = 0,
    Transfer = 1,
}

export interface CoinbaseTransaction extends Transaction {
}

export interface UserTransaction extends Transaction {
    from: string;
}

export const encodeTransaction = (tx: Transaction) => {
    return JSON.stringify(tx.data, Object.keys(tx.data).sort())
}
