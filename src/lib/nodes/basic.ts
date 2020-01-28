import * as meta from '../meta';
import * as n from '../node';

console.log('basic.ts');

export class Basic {
    peekable?: any;
    onChild?: OnChild;
    onField?: OnField;
    onNext?: OnNext;
    onChoose?: OnChoose;
    onDelete?: OnDelete;
    onBeginEdit?: OnBeginEdit;
    onEndEdit?: OnEndEdit;
    onAction?: OnAction;
    onNotify?: OnNotify;
    onPeek?: OnPeek;
    onContext?: OnContext;
}

export type OnChild =  (r: n.ChildRequest) => n.ChildResponse;

export type OnField = (r: n.FieldRequest, hnd: n.ValueHandle) => void;

export type OnNext = (r: n.ListRequest) => n.ListResponse;

export type OnChoose = (r: n.Selection, c: meta.Choice) => meta.ChoiceCase;

export type OnDelete = (r: n.NodeRequest) => void;

export type OnBeginEdit = (r: n.NodeRequest) => void;

export type OnEndEdit = (r: n.NodeRequest) => void;

export type OnAction = (r: n.ActionRequest) => n.ActionResponse;

export type OnNotify = (r: n.NotifyRequest) => (n.NotifyCloser | null);

export type OnPeek = (s: n.Selection, consumer: any) => (any|null);

export type OnContext = (s: n.Selection, ctx: Map<string, any>) => Map<string, any>;


export function node(self: Basic): n.Node {
    return {
        child(r: n.ChildRequest): n.ChildResponse {
            if (self.onChild != null) {
                return self.onChild(r);
            }
            throw new Error('Child not implemented on node ' + r.selection.path);
        },

        field(r: n.FieldRequest, hnd: n.ValueHandle) {
            if (self.onField == null) {
                throw new Error('Field not implemented on node ' + r.selection.path);
            }
            return self.onField(r, hnd);
        },

        next(r: n.ListRequest): n.ListResponse {
            if (self.onNext == null) {
                throw new Error('Next not implemented on node ' + r.selection.path);
            }
            return self.onNext(r);
        },

        choose(sel: n.Selection, choice: meta.Choice): meta.ChoiceCase {
            if (self.onChoose == null) {
                throw new Error('Choose not implemented on node ' + sel.path);
            }
            return self.onChoose(sel, choice);
        },

        remove(r: n.NodeRequest) {
            if (self.onDelete == null) {
                throw new Error('Delete not implemented on node ' + r.selection.path);
            }
            return self.onDelete(r);
        },

        beginEdit(r: n.NodeRequest) {
            if (self.onBeginEdit == null) {
                return;
            }
            return self.onBeginEdit(r);
        },

        endEdit(r: n.NodeRequest) {
            if (self.onEndEdit == null) {
                return;
            }
            return self.onEndEdit(r);
        },

        action(r: n.ActionRequest): n.ActionResponse {
            if (self.onAction == null) {
                throw new Error('Action not implemented on node ' + r.selection.path);
            }
            return self.onAction(r);
        },

        notify(r: n.NotifyRequest): (n.NotifyCloser|null) {
            if (self.onNotify == null) {
                throw new Error('Action not implemented on node ' + r.selection.path);
            }
            return self.onNotify(r);
        },

        peek(s: n.Selection, consumer: any): (any|null) {
            if (self.onPeek == null) {
                return self.peekable;
            }
            return self.onPeek(s, consumer);
        },

        context(s: n.Selection, ctx: Map<string, any>): Map<string, any> {
            if (self.onContext == null) {
                return ctx;
            }
            return self.onContext(s, ctx);
        }
    };
}
