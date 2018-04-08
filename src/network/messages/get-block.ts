import { NCoinMessage } from './message'
import { INV } from '../core'

export class NCoinGetBlockMessage extends NCoinMessage {
    static TYPE = 'getblock';
    public data: INV;
    constructor(data) {
        super()
        this._type = NCoinGetBlockMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}
