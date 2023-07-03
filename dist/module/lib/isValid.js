/**
 * Test if the data is valid according to the given schema
 *
 * @param draft - validator
 * @param value - value to validate
 * @param [schema] - json schema
 * @param [pointer] - json pointer pointing to value
 * @return if schema does match given value
 */
export default function isValid(draft, value, schema = draft.rootSchema, pointer = "#") {
    return draft.validate(value, schema, pointer).length === 0;
}
