import { expect } from "chai";
import step from "../../../lib/step";
import { Draft04 as Core } from "../../../lib/draft04";

describe("step.oneof", () => {
    let core: Core;
    before(() => (core = new Core()));

    it("should return matching schema", () => {
        const res = step(
            core,
            "title",
            {
                type: "object",
                properties: {
                    title: {
                        oneOf: [
                            { type: "string", title: "Zeichenkette" },
                            { type: "number", title: "Zahl" }
                        ]
                    }
                }
            },
            { title: 111 }
        );

        // @special case: where a schema is selected and the original schema maintained.
        // Remove the original and its flag
        delete res.oneOfSchema;
        delete res.variableSchema;
        delete res.oneOfIndex;
        expect(res).to.deep.eq({ type: "number", title: "Zahl" });
    });

    it("should return index of matching schema", () => {
        const res = step(
            core,
            "title",
            {
                type: "object",
                properties: {
                    title: {
                        oneOf: [
                            { type: "string", title: "Zeichenkette" },
                            { type: "number", title: "Zahl" }
                        ]
                    }
                }
            },
            { title: 111 }
        );

        expect(res.oneOfIndex).to.eq(1);
    });

    it("should maintain references from a remote schema when resolving oneOf with $ref", () => {
        core.addRemoteSchema("https://my-other-schema.com/schema.json", {
            type: "object",
            properties: {
                innerTitle: { $ref: "#/definitions/number" }
            },
            definitions: {
                number: { type: "number", title: "Zahl" }
            }
        });
        const schema = core.compileSchema({
            type: "object",
            properties: {
                title: {
                    oneOf: [
                        {
                            type: "object",
                            properties: { innerTitle: { type: "string", title: "Zeichenkette" } }
                        },
                        { $ref: "https://my-other-schema.com/schema.json" }
                    ]
                }
            }
        });
        const res = step(core, "title", schema, { title: { innerTitle: 111 } });

        expect(res.type).to.eq("object");

        const nextRes = step(core, "innerTitle", res, { innerTitle: 111 });
        expect(nextRes.type).to.eq("number");
    });
});
