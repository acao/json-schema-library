import path from "path";
import fs from "fs";
import { expect } from "chai";
import { JsonEditor as Core } from "../../lib/jsoneditor";
import { JsonSchema } from "../../lib/types";

describe("validate.JsonEditor", () => {
    let schema: JsonSchema;
    let data: unknown;
    let draft: Core;

    beforeEach(() => {
        schema = JSON.parse(
            fs.readFileSync(path.join(__dirname, "support", "default-schema.json"), "utf8")
        );
        data = JSON.parse(
            fs.readFileSync(path.join(__dirname, "support", "default-data.json"), "utf8")
        );
        draft = new Core(schema);
    });

    it("should validate test-data by default", () => {
        const errors = draft.validate(schema, data);

        expect(errors).to.have.length(0);
    });

    describe("resolveRef", () => {
        it("should merge any properties where $ref is used", () => {
            draft.rootSchema = { definitions: { def: { type: "string" } } };
            const result = draft.resolveRef({ $ref: "#/definitions/def", title: "a definition" });
            expect(result).to.deep.include({ type: "string", title: "a definition" });
        });
    });

    describe("oneOf", () => {
        it("should return a matching schema", () => {
            const result = draft.resolveOneOf(5, {
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            expect(result).to.deep.equal({ type: "number" });
        });

        it("should return an error if a matching schema could not be found", () => {
            const result = draft.resolveOneOf([], {
                oneOf: [{ type: "string" }, { type: "number" }]
            });
            expect(result.type).to.eq("error");
            expect(result.name).to.eq("OneOfError");
        });

        it("should return an error if multiple schemas match the data", () => {
            const result = draft.resolveOneOf(4, {
                oneOf: [
                    { type: "string" },
                    { type: "number", minimum: 2 },
                    { type: "number", minimum: 3 }
                ]
            });

            expect(result.type).to.eq("error");
            expect(result.name).to.eq("MultipleOneOfError");
        });

        describe("oneOfProperty", () => {
            it("should return schema where 'oneOfProperty'-value matches schema", () => {
                const result = draft.resolveOneOf(
                    { id: "2" },
                    {
                        oneOfProperty: "id",
                        oneOf: [
                            { properties: { id: { pattern: "^1$" } } },
                            { properties: { id: { pattern: "^2$" } } },
                            { properties: { id: { pattern: "^3$" } } }
                        ]
                    }
                );
                expect(result).to.deep.equal({ properties: { id: { pattern: "^2$" } } });
            });
        });

        describe("fuzzyMatch", () => {
            it("should return schema where most properties match", () => {
                const result = draft.resolveOneOf(
                    { id: "4", a: 1, b: 2 },
                    {
                        oneOf: [
                            { properties: { id: { pattern: "^1$" }, a: { type: "object" } } },
                            {
                                properties: {
                                    id: { pattern: "^2$" },
                                    a: { type: "string" },
                                    b: { type: "number" }
                                }
                            },
                            { properties: { id: { pattern: "^3$" }, a: { type: "number" } } }
                        ]
                    }
                );
                expect(result).to.deep.equal({
                    properties: {
                        id: { pattern: "^2$" },
                        a: { type: "string" },
                        b: { type: "number" }
                    }
                });
            });
        });
    });
});
