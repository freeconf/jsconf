import * as meta from '../meta.js';
import * as n from '../node.js';

console.log('extend.ts');

export interface Extend {
    base: n.Node;
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

export function node(self: Extend): n.Node {
    return {
        child(r: n.ChildRequest) {
            if (self.onChild !== undefined) {
                return self.onChild(self.base, r);
            }
            return self.base.child(r);
        },

        field(r: n.FieldRequest, hnd: n.ValueHandle) {
            if (self.onField == null) {
                self.base.field(r, hnd);
            } else {
                self.onField(self.base, r, hnd);
            }
        },

        next(r: n.ListRequest) {
            if (self.onNext == null) {
                return self.base.next(r);
            }
            return self.onNext(self.base, r);
        },

        choose(sel: n.Selection, choice: meta.Choice) {
            if (self.onChoose == null) {
                return self.base.choose(sel, choice);
            }
            return self.onChoose(self.base, sel, choice);
        },

        remove(r: n.NodeRequest) {
            if (self.onDelete == null) {
                self.base.remove(r);
            } else {
                self.onDelete(self.base, r);
            }
        },

        beginEdit(r: n.NodeRequest) {
            if (self.onBeginEdit == null) {
                self.base.beginEdit(r);
            } else {
                self.onBeginEdit(self.base, r);
            }
        },

        endEdit(r: n.NodeRequest) {
            if (self.onEndEdit == null) {
                self.base.endEdit(r);
            } else {
                self.onEndEdit(self.base, r);
            }
        },

        action(r: n.ActionRequest) {
            if (self.onAction == null) {
                throw new Error('action not implemented on node ' + r.selection.path);
            }
            return self.onAction(self.base, r);
        },

        notify(r: n.NotifyRequest) {
            if (self.onNotify == null) {
                throw new Error('notify not implemented on node ' + r.selection.path);
            }
            return self.onNotify(self.base, r);
        },

        peek(s: n.Selection, consumer: any): (any|null) {
            if (self.onPeek == null) {
                return self.base.peek(s, consumer);
            }
            return self.onPeek(self.base, s, consumer);
        },

        context(s: n.Selection, ctx: Map<string, any>) {
            if (self.onContext == null) {
                return ctx;
            }
            return self.onContext(self.base, s, ctx);
        }
    };
}

export type OnChild = (parent: n.Node, r: n.ChildRequest) => n.ChildResponse;

export type OnField = (parent: n.Node, r: n.FieldRequest, hnd: n.ValueHandle) => void;

export type OnNext = (parent: n.Node, r: n.ListRequest) => n.ListResponse;

export type OnChoose = (parent: n.Node, r: n.Selection, c: meta.Choice) => meta.ChoiceCase;

export type OnDelete = (parent: n.Node, r: n.NodeRequest) => void;

export type OnBeginEdit = (parent: n.Node, r: n.NodeRequest) => void;

export type OnEndEdit = (parent: n.Node, r: n.NodeRequest) => void;

export type OnAction = (parent: n.Node, r: n.ActionRequest) => n.ActionResponse;

export type OnNotify = (parent: n.Node, r: n.NotifyRequest) => (n.NotifyCloser|null);

export type OnPeek = (parent: n.Node, s: n.Selection, consumer: any) => (any|null);

export type OnContext = (parent: n.Node, s: n.Selection, ctx: Map<string, any>) => Map<string, any>;
