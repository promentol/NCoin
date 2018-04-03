import {
    Transaction,
    TransactionType,
    Block,
    BlockHeader,
    hashBlock,
    encodeBlockHeader,
    encodeTransaction,
    calculateMerkle
} from '../src/core'

/*
debug(encodeBlockHeader({
    header: {
        previousBlockHash: null,
        depth: 4,
        merkleRoot: null,
        payload: ""
    },
    singature: "string",
    transactions: []
}));

debug(calculateMerkle([<Transaction>{
    data:{
        from: "asd",
        to: "asd",
        type: TransactionType.CoinBase,
        amount: 100,
        none:12,
        payload: ""
    },
    signature: "asd"
}]))
*/
function debug(x) {
    if (x.subscribe){
        x.subscribe((a) => console.log(a))
    } else {
        console.log(x)
    }
}
