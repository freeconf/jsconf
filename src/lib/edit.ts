import * as meta from './meta.js';
import * as val from './val.js';
import * as node from './node.js';

export enum strategy {
    upsert,
    insert,
    update,
}

console.log("edit.ts");

class DefIterator {
    private dataDef: meta.Definition[];
    private pos: number = 0;
    private nextDef: (meta.Definition|null);
    private choiceIterator: (DefIterator|null);

    constructor(public sel: node.Selection, nested?: meta.ChoiceCase){
        if (nested == null) {
            this.dataDef = (sel.meta as meta.Nodeable).dataDef;
        } else {
            this.dataDef = nested.dataDef;
        }
        this.lookAhead();
    }

    hasNext(): boolean {
        return this.nextDef != null;
    }

    next(): meta.Definition {
        if (this.nextDef == null) {
            throw new Error('end of iterator');
        }
        let n = this.nextDef;
        this.lookAhead();
        return n;
    }
    
    lookAhead(): void {
        this.nextDef = null;
        while (true) {
            if (this.choiceIterator != null) {
                if (this.choiceIterator.hasNext()) {
                    this.nextDef = this.choiceIterator.next();
                    return;
                }
                this.choiceIterator = null
            }
            if (this.pos < this.dataDef.length) {
                let n = this.dataDef[this.pos++];
                if (n instanceof meta.Choice) {
                    let chosen = this.sel.node.choose(this.sel, n);
                    this.choiceIterator = new DefIterator(this.sel, chosen);
                    continue;
                }
                this.nextDef = n;
                return;
            }
            return;
        }
    }
}

export class Editor {
    useDefault: boolean;
    constructor(public basePath: node.Path) {}

    edit(from: node.Selection, to: node.Selection, strategy: strategy) {
        this.enter(from, to, false, strategy, true, true);
    }

    enter(from: node.Selection, to: node.Selection, create: boolean, strategy: strategy, root: boolean, bubble: boolean) {
        to.beginEdit({
            create: create,
            source: to,
            editRoot: root
        } as node.NodeRequest, bubble);

        if ((from.meta instanceof meta.List) && !from.insideList) {
            this.list(from, to, from.meta as meta.List, create, strategy);
        } else {
            let i = new DefIterator(from);
            while (i.hasNext()) {
                let d = i.next();
                if (meta.isLeaf(d)) {
                    this.leaf(from, to, d as meta.Leafable, create, strategy);
                } else {
                    this.node(from, to, d as meta.Nodeable, create, strategy);
                }
            }
        }
        to.endEdit({
            source: to,
            create: create,
            editRoot: root
        } as node.NodeRequest, bubble);
    }

    list(from: node.Selection, to: node.Selection, meta: meta.List, _: boolean, s: strategy) {
        let rFrom = node.ListRequest.readerByRow(from, meta, 0);
        let fromChild = from.selectListItem(rFrom);
        while (fromChild != null) {
            let newChild = false;
            let toChild:{sel:node.Selection, key:val.Value[]}|null;
            if (fromChild.key != null) {
                let rTo = node.ListRequest.readerByKey(to, meta, fromChild.key);
                toChild = to.selectListItem(rTo);
            } else {
                toChild = null;
            }

            let wTo = node.ListRequest.writer(to, meta, fromChild.sel, this.basePath, fromChild.key);
            switch (s) {
            case strategy.insert:
                if (toChild != null) {
                    throw new Error(`Duplicate item '${meta.ident}' found in '${rFrom.path}'`)
                }
                toChild = to.selectListItem(wTo);
                newChild = true; 
                break;
            case strategy.upsert:
                if (toChild == null) {
                    toChild = to.selectListItem(wTo);
                    newChild = true; 
                }
                break;
            case strategy.update:
                if (toChild == null) {
                    throw new Error(`cannot update '${meta.ident}' not found in '${rFrom.path}' container destination node `);
                }
                break;
            }

            if (toChild == null) {
                throw new Error(`'${wTo.path}' could not create '${meta.ident}' container node.`);
            }
            this.enter(fromChild.sel, toChild.sel, newChild, s, false, false);
    
            rFrom = rFrom.next();
            fromChild = from.selectListItem(rFrom);
        }
    }

    node(from: node.Selection, to: node.Selection, meta: meta.Nodeable, _: boolean, s: strategy) {
        let rFrom = node.ChildRequest.reader(from, meta);
        let fromChild = from.select(rFrom);
        if (fromChild == null) {
            return;
        }
        let rTo = node.ChildRequest.reader(to, meta);
        let toChild = to.select(rTo);
        let newChild = false;

        let wTo = node.ChildRequest.writer(to, meta, fromChild, this.basePath);
        switch (s) {
        case strategy.insert:
            if (toChild != null) {
                throw new Error(`Duplicate item '${meta.ident}' found in '${rFrom.path}'`)
            }
            toChild = to.select(wTo);
            newChild = true;
            break;
        case strategy.upsert:
            if (toChild == null) {
                toChild = to.select(wTo);                
                newChild = true;
            }
            break;
        case strategy.update:
            if (toChild == null) {
                throw new Error(`cannot update '${meta.ident}' not found in '${rFrom.path}' container destination node`);
            }
            break;
        }

        if (toChild == null) {
            throw new Error(`'${wTo.path}' could not create '${meta.ident}' container node`);
        }
        this.enter(fromChild, toChild, newChild, s, false, false)
    }

    leaf(from: node.Selection, to: node.Selection, meta: meta.Leafable, create: boolean, s: strategy) {
        let rFrom = node.FieldRequest.reader(from, meta);
        let useDefault = (s != strategy.update && create) || this.useDefault;
        let hnd = from.valueHnd(rFrom, useDefault);
        if (hnd.val != null) {
            let rTo = node.FieldRequest.writer(to, meta, from, this.basePath);
            to.setValueHnd(rTo, hnd);
        }
    }
}