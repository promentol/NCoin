import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import Persistent from './Persistence'

import * as Crypto from './Crypto'

import { Transaction, TransactionType } from './Transaction'

import { Block, BlockHeader, BlockType } from './Block'
import Persistence from './Persistence';


export const getBlockCount = () => {
    return Observable.of(0)
}

export const getBlock = (blockHash) => {
    return Persistent.Instance.getBlockByHash(blockHash)
}
export const getTransaction = (txHash) => {
    return Persistent.Instance.getTransactionByHash(txHash)
}

export const createTransaction = (tx: Transaction, privateKey) => {
    tx.data.nonce = generateNonce(tx.data.from); 
    Crypto.signTransaction(tx, privateKey);
    this.processBlock(tx)
}

export const createBlock = (transactionsPool: Transaction[], payload: string, minerPrivateKey): Block  => {

    const transactions = [
        createCoinbase(minerPrivateKey, payload),
        ...prepareTransactions(transactionsPool)
    ];
    const header = {
        previousBlockHash: "Persistent.Instance.getCurrent",
        depth: 0,
        type: BlockType.Usual,
        merkleRoot: Crypto.calculateMerkle(transactions),
        payload
    };
    const block = <Block>{
        header,
        transactions
    }
    Crypto.signBlock(block, minerPrivateKey)
    return processBlock(block)
}

const prepareTransactions = (transactionsPool: Transaction[]) => {
    return []
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
    //
}
export const acceptBlock = () => {
    //verifyBlock
}

const generateNonce = (user: string) => {
    return Persistence.Instance.currentState.getValue().get(user).nonce + 1;
}
export const processTransaction = (tx: Transaction) => {
    Persistence.Instance.addTransactionToPool(tx)
}


export const processBlock = (block: Block) => {
    /*
    return Persistence.Instance.lastBlock.map((lastBlock)=>{
        if()
    })
    if(block.header.depth)
    Persistence.Instance.saveBlock(block);
    return verifyBlock(block).switchMap((x) => {

        ///Last Block logic
        if (x) {
            return saveBlock(block)
        } else {
            throw new Error("invalid block")
        }
    })
    */
   return block
}