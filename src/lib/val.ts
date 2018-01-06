
console.log('val.ts');

export class Value {
    constructor(public readonly val: any, public readonly format: Format) {}

    toString(): string {
        return this.val.toString();
    }
}

export function enm(e: Enum): Value {
    return new Value(e, Format.Enum);
}

export function enums(e: Enum[]): Value {
    return new Value(e, Format.EnumList);
}

export function str(s: string): Value {
    return new Value(s, Format.Str);
}

export function int8(n: number): Value {
    return new Value(n, Format.Int8);
}

export function int16(n: number): Value {
    return new Value(n, Format.Int16);
}

export function int32(n: number): Value {
    return new Value(n, Format.Int32);
}

export function int64(n: number): Value {
    return new Value(n, Format.Int64);
}

export function uint8(n: number): Value {
    return new Value(n, Format.UInt8);
}

export function uint16(n: number): Value {
    return new Value(n, Format.UInt16);
}

export function uint32(n: number): Value {
    return new Value(n, Format.UInt32);
}

export function uint64(n: number): Value {
    return new Value(n, Format.UInt64);
}

export function decimal64(n: number): Value {
    return new Value(n, Format.Decimal64);
}

export enum Format {
    Binary = 1,
    Bits,
    Boolean,
    Decimal64,
    Empty,
    Enum,
    IdentityRef,
    InstanceRef,
    Int8,
    Int16,
    Int32,
    Int64,
    LeafRef,
    Str,
    UInt8,
    UInt16,
    UInt32,
    UInt64,
    Union,
    Any,
    BinaryList = 1025,
    BitsList,
    BooleanList,
    Decimal64List,
    EmptyList,
    EnumList,
    IdentityRefList,
    InstanceRefList,
    Int8List,
    Int16List,
    Int32List,
    Int64List,
    LeafRefList,
    StrList,
    UInt8List,
    UInt16List,
    UInt32List,
    UInt64List,
    UnionList,
    AnyList,
}

export interface Enum {
    id: number;
    label: string;
}

export class EnumList {
    constructor(public enums: Enum[]) {}

    byId(id: number): Enum {
        for (const x of this.enums) {
            if (x.id === id) {
                return x;
            }
        }
        throw new Error('no enum with id ' + id);
    }

    byLabel(label: string): Enum {
        for (const x of this.enums) {
            if (x.label === label) {
                return x;
            }
        }
        throw new Error('no enum with label ' + label);
    }
}

export function conv(f: Format, x: any): Value {
    // TODO: implement conversions
    return new Value(x, f);
}