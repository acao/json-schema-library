import { mergeSchema } from "./mergeSchema";
import { resolveIfSchema } from "./features/if";
import { resolveDependencies } from "./features/dependencies";
import { mergeAllOfSchema } from "./features/allOf";
import { mergeValidAnyOfSchema } from "./features/anyOf";
import { resolveOneOfFuzzy as resolveOneOf } from "./features/oneOf";
import { omit } from "./utils/omit";
const toOmit = ["allOf", "anyOf", "oneOf", "dependencies", "if", "then", "else"];
const dynamicProperties = ["allOf", "anyOf", "oneOf", "dependencies", "if"];
export function isDynamicSchema(schema) {
    const givenProps = Object.keys(schema);
    return dynamicProperties.findIndex((prop) => givenProps.includes(prop)) !== -1;
}
/**
 * @note this utility does not reference draft methods for resolution
 * @todo consider using draft methods
 *
 * Resolves all dynamic schema definitions for the given input data and returns
 * the resulting json-schema without any dynamic schema definitions. The result
 * is not merged with the original input schema, thus static definitions of the
 * input schema are untouched and missing. For a full schema definition of this
 * input data you have to merge the result with the original schema
 * (@see reduceSchema)
 *
 * dynamic schema definitions: dependencies, allOf, anyOf, oneOf, if
 *
 * @returns static schema from resolved dynamic schema definitions for this
 *  specific input data
 */
export function resolveDynamicSchema(draft, schema, data) {
    let resolvedSchema;
    schema = draft.resolveRef(schema);
    // @feature oneOf
    if (schema.oneOf) {
        const oneOfSchema = resolveOneOf(draft, data, schema);
        if (oneOfSchema && oneOfSchema.type !== "error") {
            resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, oneOfSchema);
        }
    }
    // @feature allOf
    const allOfSchema = mergeAllOfSchema(draft, schema);
    if (allOfSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, allOfSchema);
    }
    // @feature anyOf
    const anyOfSchema = mergeValidAnyOfSchema(draft, schema, data);
    if (anyOfSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, anyOfSchema);
    }
    // @feature dependencies
    const dependenciesSchema = resolveDependencies(draft, schema, data);
    if (dependenciesSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, dependenciesSchema);
    }
    // @feature if-then-else
    const ifSchema = resolveIfSchema(draft, schema, data);
    if (ifSchema) {
        resolvedSchema = mergeSchema(resolvedSchema !== null && resolvedSchema !== void 0 ? resolvedSchema : {}, ifSchema);
    }
    if (resolvedSchema == null) {
        return;
    }
    const nestedSchema = resolveDynamicSchema(draft, resolvedSchema, data);
    if (nestedSchema) {
        resolvedSchema = mergeSchema(resolvedSchema, nestedSchema);
    }
    return omit(resolvedSchema, ...toOmit);
}
