import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import Persistent from './Persistence'

import * as Crypto from './Crypto'

import { Transaction, TransactionType } from './Transaction'

import { Block, BlockHeader, BlockType } from './Block'


export const getBlockCount = () => {
    return Observable.of(0)
}

export const getBlock = (blockHash) => {
    return Persistent.Instance.getBlockByHash(blockHash)
}
export const getTransaction = (txHash) => {
    return Persistent.Instance.getTransactionByHash(txHash)
}

/*
export const createTransaction = (tx: Transaction): Transaction => {
    return 
}
*/

export const createBlock = (transactionsPool: Transaction[], payload: string, minerPrivateKey): Block  => {

    const transactions = [
        createCoinbase(minerPrivateKey, payload),
        ...transactionsList
    ];
    const header;
    const block = <Block>{
        header: {
            previousBlockHash: "Persistent.Instance.getCurrent",
            depth: 0,
            type: BlockType.Usual,
            merkleRoot: Crypto.calculateMerkle(transactions),
            payload
        },
        transactions
    }
    Crypto.signBlock(block, minerPrivateKey)
    return processBlock(block)
}

export const createCoinbase = (privateKey, payload: string)=>{
    return <Transaction>{
        data: {
            to: Crypto.generatePublicKey(privateKey),
            type: TransactionType.CoinBase,
            amount: 100,
            payload,
            nonce: 0
        }
    }
}

export const acceptTransaction = () => {

}
export const acceptBlock = () => {

}

const generateNonce = (user: string) => {
    //query all blocks until to get a noce
}
export const processTransaction = (tx: Transaction) => {
    if (verifyTransactionSignature(tx) )
    // 
}


export const processBlock = (block: Block) => {
    return verifyBlock(block).switchMap((x) => {

        ///Last Block logic
        if (x) {
            return saveBlock(block)
        } else {
            throw new Error("invalid block")
        }
    })
}*/