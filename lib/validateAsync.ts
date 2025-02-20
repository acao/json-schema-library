import { errorsOnly } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import { JsonSchema, JsonPointer, JsonError, isJsonError } from "./types";
import { Draft } from "./draft";

function createErrorNotification(onError: OnError) {
    return function notifyError(error: JsonError | JsonError[]) {
        if (Array.isArray(error)) {
            error = flattenArray(error);
            error.forEach(notifyError);
            return error;
        }
        if (isJsonError(error)) {
            onError(error);
        }
        return error;
    };
}

export interface OnError {
    (error: JsonError): void;
}

export type Options = {
    schema?: JsonSchema;
    pointer?: JsonPointer;
    onError?: OnError;
};

/**
 * @async
 * Validate data by a json schema
 *
 * @param draft - validator
 * @param value - value to validate
 * @param options
 * @param options.schema - json schema to use, defaults to draft.rootSchema
 * @param options.pointer - json pointer pointing to current value. Used in error reports
 * @param options.onError   - will be called for each error as soon as it is resolved
 * @return list of errors or empty
 */
export default function validateAsync(
    draft: Draft,
    value: any,
    options?: Options
): Promise<Array<JsonError>> {
    const { schema, pointer, onError } = { schema: draft.rootSchema, pointer: "#", ...options };

    let errors: Array<JsonError> = draft.validate(value, schema, pointer);
    if (onError) {
        errors = flattenArray(errors);
        const notifyError = createErrorNotification(onError);
        for (let i = 0; i < errors.length; i += 1) {
            if (errors[i] instanceof Promise) {
                errors[i].then(notifyError);
            } else if (isJsonError(errors[i])) {
                onError(errors[i]);
            }
        }
    }

    return Promise.all(errors)
        .then(flattenArray)
        .then((resolvedErrors) => resolvedErrors.filter(errorsOnly))
        .catch((e) => {
            console.log("Failed resolving promises", e.message);
            console.log(e.stack);
            throw e;
        });
}
