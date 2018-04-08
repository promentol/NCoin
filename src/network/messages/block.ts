import { NCoinMessage } from './message'
import { Transaction, Block } from '../../core'

export class NCoinBlockMessage extends NCoinMessage {
    static TYPE = 'block';
    public data: Block;
    constructor(data) {
        super()
        this._type = NCoinBlockMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}
