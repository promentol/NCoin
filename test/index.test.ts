import {
    Transaction,
    TransactionType,
    Block,
    Persistence,
    BlockHeader,
    Actions,
    encodeBlockHeader,
    encodeTransaction,
} from '../src/core'
/*
var levelup = require('levelup')
var leveldown = require('leveldown')

// 1) Create our store
var db = levelup(leveldown('./data'))


/*
Persistence.Instance.setDB(db).subscribe(() => {
    Actions.getBlockUntill('6319dabd2040e9f24f7fb09876c5e4b9797ad96661f5b3be8275b8c2c38707dd').subscribe((x) => {
        console.log(x)
    })
})

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

export const NCoinMessageSchema = {
    "$id": "NCoinMessageSchema",
    //"$schema": "http://json-schema.org/schema#",
    "title": "Message",
    "type": "object",
    "required": ["type", "data"],
    "properties": {
        "type": {
            "type": "string"
        },
        "data": {
            "type": "string"
        }
    }
}



/*
ajv.addSchema(NCoinMessageSchema);

var validate = ajv.compile(NCoinInvMessageSchema);

//validate.addSchema(NCoinInvMessageSchema)
var valid = validate({
    type: 'asd',
    data: [
        {
            "type": 0,
            "hash": "asasasasasasasasasasasasasasasas"
        }
    ]
});
if (!valid) console.log(validate.errors);
*/

import * as ndjson from 'ndjson'

var LDJSONStream = require('ld-jsonstream');

var ls = ndjson.parse()

ls.on('data', function (obj) {
    console.log(typeof obj, obj);
});

ls.on('error', function (err) {
    console.log(err);
});

ls.write('{ "foo" : "bar" }\n   n  { "foo" : "baz" }\n');