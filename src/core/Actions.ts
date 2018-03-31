export const getBlockCount = () => {

}

export const createTransaction = ()/*: Transaction */ => {
}

export const createBlock = (block, miner)/*: Block */ => {

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
}