import { NCoinMessage } from './message'
import { INV } from '../core'

export class NCoinGetDataMessage extends NCoinMessage {
    static TYPE = 'getdata';
    public data: INV;
    constructor(data) {
        super()
        this._type = NCoinGetDataMessage.TYPE
        this.data = data;
    }
    get payload(): any {
        return this.data;
    }

}