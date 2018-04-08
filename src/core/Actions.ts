import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { Crypto } from './Crypto'

import { Transaction, TransactionType } from './Transaction'

import { Block, BlockHeader, BlockType } from './Block'
import {Persistence} from './Persistence';
import { last } from 'rxjs/operators';
import { verifyBlock, verifyTransaction } from './Verifier';
import { applyTransactionToState } from './State';


export namespace Actions {
    export const getBlockCount = () => {
        return Persistence.Instance.lastBlock.take(1).map((x)=>{
            return x.header.depth
        })
    }
    export const getBlock = (blockHash) => {
        return Persistence.Instance.getBlockByHash(blockHash)
    }
    export const getTransaction = (txHash) => {
        return Persistence.Instance.getTransactionByHash(txHash)
    }

    export const createTransaction = (tx: Transaction, privateKey) => {
        tx.data.nonce = generateNonce(tx.data.from);
        Crypto.signTransaction(tx, privateKey);
        return processTransaction(tx)
    }

    export const createBlock = (transactionsPool: Transaction[], payload: string, minerPrivateKey): Observable<Block> => {
        return Persistence.Instance.lastBlock.take(1).map((lastBlock: Block)=>{
            const transactions = [
                createCoinbase(minerPrivateKey, payload),
                ...prepareTransactions(transactionsPool)
            ];
            const header = {
                previousBlockHash: Crypto.hashBlock(lastBlock),
                depth: lastBlock.header.depth+1,
                type: BlockType.Usual,
                merkleRoot: Crypto.calculateMerkle(transactions),
                payload
            };
            const block = <Block>{
                header,
                transactions
            }
            Crypto.signBlock(block, minerPrivateKey)
            return block
        })
    }

    export const prepareTransactions = (transactionsPool: Transaction[]) => {
        return []
    }

    export const createCoinbase = (privateKey, payload: string) => {
        return <Transaction>{
            data: {
                to: Crypto.generatePublicKey(privateKey).toString('hex'),
                type: TransactionType.CoinBase,
                amount: 100,
                payload,
                nonce: 0
            }
        }
    }

    export const acceptTransaction = (tx: Transaction) => {
        return verifyTransaction(tx).map((valid)=>{
            return Actions.processTransaction(tx)
        })
    }
    export const acceptBlock = (block: Block) => {
        return verifyBlock(block).switchMap((x)=>{
            console.log('x', x)
            if(x) {
                return processBlock(block)
            }
        })
    }

    export const generateNonce = (user: string) => {
        const state = Persistence.Instance.currentState.getValue().get(user);
        return state ? state.nonce + 1 : 1;
    }
    export const processTransaction = (tx: Transaction) => {
        //verify transaction
        return Persistence.Instance.addTransactionToPool(tx)
    }

    export const processBlock = (block: Block): Observable<Block> => {
        return Persistence.Instance.lastBlock.take(1).switchMap((lastBlock: Block) => {
            if(Crypto.hashBlock(lastBlock) == block.header.previousBlockHash) {
                return Persistence.Instance.saveLastBlock(block).take(1);
            } else {
                return Persistence.Instance.saveBlock(block).take(1);
            }
        }) 
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
    }

    export const getBlockUntill = (blockHash, from?, acc=[]) => {
        if(blockHash == from) {
            return Observable.of(acc)
        }
        const obs = from ? Persistence.Instance.getBlockByHash(from) : Persistence.Instance.lastBlock.take(1);
        return obs.switchMap(b=>{
            return getBlockUntill(blockHash, b.header.previousBlockHash, [Crypto.hashBlock(b), ...acc])
        })
    }
}