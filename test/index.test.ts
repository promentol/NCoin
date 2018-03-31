import {
    Transaction,
    getBlockByHash,
    checkBlockByHash,
    Block,
    BlockHeader,
    hashBlock,
    encodeBlockHeader,
    encodeTransaction,
    calculateMerkle
} from '../src/index'

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
        type: "coinbase",
        amount: 100,
        payload: ""
    },
    signature: "asd"
}]))

function debug(x) {
    if (x.subscribe){
        x.subscribe((a) => console.log(a))
    } else {
        console.log(x)
    }
}
