/* eslint max-len: 0 */
import { expect } from "chai";
import glob from "glob";
import path from "path";
import chalk from "chalk";
import flattenArray from "../../lib/utils/flattenArray";
import addSchema from "../../lib/addSchema";

// setup remote files
const remotesPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "remotes", "**", "*.json");
const remotes = glob.sync(remotesPattern);
remotes.forEach(filepath => {
    const file = require(filepath); // eslint-disable-line
    const remoteId = `http://localhost:1234/${filepath.split("/remotes/").pop()}`;
    addSchema(remoteId, file);
})

// fetch TestCases
const globPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft4", "**", "*.json");
// const globPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft4", "ref.json");
// const globPattern = path.join(__dirname, "..", "..", "node_modules", "json-schema-test-suite", "tests", "draft4", "refRemote.json");
let draft04TestCases = glob.sync(globPattern);
if (draft04TestCases.length === 0) {
    throw new Error(`Failed retrieving tests from ${globPattern}`);
}

// load TestCases
draft04TestCases = flattenArray(draft04TestCases.map(require));


export default function runTests(Core, skipTest = []) {
    draft04TestCases.forEach(testCase => {
        const schema = testCase.schema;
        if (skipTest.includes(testCase.description)) {
            console.log(chalk.red(`Unsupported '${testCase.description}'`));
            return;
        }

        describe(testCase.description, () => {
            testCase.tests.forEach(testData => {
                const test = skipTest.includes(testData.description) ? it.skip : it;

                test(testData.description, () => {
                    const validator = new Core(schema);
                    const isValid = validator.isValid(testData.data);
                    expect(isValid).to.eq(testData.valid);
                });
            });
        });
    });
}
