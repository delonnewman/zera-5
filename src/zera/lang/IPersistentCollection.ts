import { ISeqable } from "../runtime"

export interface IPersistentCollection extends ISeqable {
    count(): number
    cons(x: any): IPersistentCollection
    //empty(): IPersistentCollection
    //equiv(a: any): boolean
}
