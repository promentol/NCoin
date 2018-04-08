import { NCoinMessage } from './message'
import { Transaction } from '../../core/Transaction'

export class NCoinTxMessage extends NCoinMessage {
    static TYPE = 'tx';
    public data: Transaction;
    constructor(data) {
        super()
        this._type = NCoinTxMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}