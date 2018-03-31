import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import Persistent from './Persistence'

export const getBlockCount = () => {
    return Observable.of(0)
}

export const getBlock = (blockHash) => {
    return Persistent.Instance.getBlockByHash(blockHash)
}
export const getTransaction = (txHash) => {
    return Persistent.Instance.getTransactionByHash(txHash)
}

export const createTransaction = ()/*: Transaction */ => {
    return 
}

export const createBlock = (block, miner)/*: Block */ => {

}

export const acceptTransaction = () => {

}
export const acceptBlock = () => {

}

const generateNonce = (user: string) => {
    //query all blocks until to get a noce
}
/*
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