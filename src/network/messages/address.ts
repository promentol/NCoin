import { NCoinMessage } from './message'
import { Address } from '../core'

export class NCoinAddressMessage extends NCoinMessage {
    static TYPE = 'address'
    private data: Address[];
    constructor(addr: Address[] | Buffer) {
        super()
        this._type = NCoinAddressMessage.TYPE
        if (addr instanceof Buffer) {
            this.data = JSON.parse(addr.toString()).data
        } else {
            this.data = addr
        }
    }
    get payload(): any {
        return this.data;
    }
    get addresses() {
        return this.data
    }
}