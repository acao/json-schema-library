import getSchema from "./getSchema";
import { JsonEditor as Draft } from "./jsoneditor";
import gp from "@sagold/json-pointer";
import copy from "./utils/copy";
export default class SchemaService {
    constructor(schema, data) {
        this.draft = new Draft(schema);
        this.schema = schema;
        this.data = data;
        this.cache = {};
    }
    updateData(data) {
        this.data = data;
        this.cache = {};
    }
    updateSchema(schema) {
        this.schema = schema;
        this.draft.setSchema(schema);
        this.cache = {};
    }
    get(pointer, data) {
        if (data) {
            // possibly separate entry point
            const schema = getSchema(this.draft, pointer, data, this.schema);
            return copy(schema);
        }
        if (pointer === "#") {
            // root
            return this.schema;
        }
        if (this.cache[pointer]) {
            // return cached result
            return this.cache[pointer];
        }
        const parentPointer = gp.join(pointer, "..");
        let parentSchema = this.cache[parentPointer];
        if (parentSchema == null) {
            // store parent (major performance improvement if its within oneof)
            parentSchema = getSchema(this.draft, parentPointer, this.data, this.schema);
            if (parentSchema.variableSchema !== true) {
                this.cache[parentPointer] = copy(parentSchema);
            }
        }
        // step from parent to child
        const key = gp.split(pointer).pop();
        let schema = getSchema(this.draft, key, gp.get(this.data, parentPointer), this.cache[parentPointer]);
        schema = copy(schema);
        if (schema.variableSchema !== true) {
            this.cache[pointer] = schema;
        }
        return schema;
    }
}
