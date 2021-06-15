import { Seq, ISeq } from "./Seq";
import { zeraProtocol } from "../types";

@zeraProtocol('zera.lang.List', Seq)
export class List extends Seq implements ISeq { }

export function isList(x: any): boolean {
    return x instanceof List;
}
