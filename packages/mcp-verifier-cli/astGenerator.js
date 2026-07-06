import AST from 'abstract-syntax-tree';
const { parse, find } = AST;
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {bundleProject, generateSHA} from './signProject.js';
import esprima from 'esprima';
import estraverse from 'estraverse';
/**
 * @example
*   {
    type: 'Program',
    sourceType: 'module',
    body: [
        {
        type: 'ImportDeclaration',
        specifiers: [
            {
            type: 'ImportSpecifier',
            local: { type: 'Identifier', name: 'generateKey' },
            imported: { type: 'Identifier', name: 'generateKey' }
            }
        ],
        source: { type: 'Literal', value: './keyGenerator' }
        },
        {
        type: 'ImportDeclaration',
        specifiers: [
            {
            type: 'ImportDefaultSpecifier',
            local: { type: 'Identifier', name: 'express' }
            }
        ],
        source: { type: 'Literal', value: 'express' }
        },
        {
        type: 'ExpressionStatement',
        expression: {
            type: 'CallExpression',
            callee: {
            type: 'MemberExpression',
            object: { type: 'Identifier', name: 'console' },
            computed: false,
            property: { type: 'Identifier', name: 'log' }
            },
            arguments: [
            {
                type: 'Literal',
                value: 'Hey man im just testing things out idk how this forms a output'
            }
            ]
        }
        }
    ]
    }
 */
/**
 * From the test.js file - pretty visible - npm dependecnies don't have path mentioned in source.
 * Support files have ./ begining in the import in the tree.
 * 
 * So extract those files where tree.body.type == ImportDeclaration && tree.body.
 */
/**
 * 
 * @param {*} entryPoint 
 * @improvements 1. Missing extension - later 
 * 2.File doesn't exist - use with existsSync
 * 3. Edge case like const x = - fix try {
    const currTree = parse(currFileData);
} catch (err) {
    continue;
}
 */
const SENSITIVE_PATHS = [
  // Windows
  "system32",
  "syswow64",
  "windows",
  "program files",
  "program files (x86)",
  "users",
  "appdata",
  "programdata",

  // Linux / macOS
  "/etc",
  "/bin",
  "/sbin",
  "/usr",
  "/boot",
  "/root",
  "/var",
  "/lib",
  "/lib64",
  "/opt",
  "/home",

  // macOS specific
  "/system",
  "/applications",
  "/library",
];
const FILE_WRITE_APIS = [
  "writeFile",
  "writeFileSync",
  "appendFile",
  "appendFileSync",
  "truncate",
  "truncateSync",
  "rename",
  "renameSync",
  "unlink",
  "unlinkSync",
  "rm",
  "rmSync",
  "rmdir",
  "rmdirSync",
  "copyFile",
  "copyFileSync",
  "createWriteStream",
  "mkdir",
  "mkdirSync",
  "chmod",
  "chmodSync",
  "chown",
  "chownSync"
];
const DESTRUCTIVE_COMMANDS = [
  // Windows
  "del",
  "erase",
  "rmdir",
  "rd",
  "format",
  "takeown",
  "icacls",

  // Linux/macOS
  "rm",
  "mv",
  "chmod",
  "chown",
  "dd",
  "mkfs",
  "shred"
];

const NET_LIBS = [
  "http",
  "https",
  "net",
  "tls",
  "axios",
  "got",
  "undici"
]
const NET_METHODS = [
  "request",
  "get",
  "post",
  "put",
  "delete",
  "connect",
  "fetch"
]
/**
 * SHA TRACKING
 */
let shaFile = [];

/**
 * FILE TRACKING
 */
let fileQueue = [];
const visited = new Set();

/**
 * FLAG VAR
 */
let varTracked = new Set();
let largeArrCount = 0;
let literalCount = 0;
let hexStringCount = 0;
let networkCalls = 0;
let harmfullCode = 0;
let maxArrayDepth = 0;

let llmJson = [];
let flagged = [];
let allEnv = [];
import os from 'os';


function testHex(node){
    if(!node) return 0;

    if(node?.type == 'Literal' && typeof node.value === "string"){
        literalCount++;
        if (/\\x[0-9a-fA-F]{2}/.test(node.raw)) {
                hexStringCount++;
                llmJson.push({
                    observation: "HEX_STRING",
                    line: node.loc?.start?.line,
                    value: node.value
                });
        }
    }

    return 0;
}
function countElementsRecursively(node) {
    if (!node) return 0;

    testHex(node);

    if (node.type === 'ArrayExpression' && node.elements) {
        let count = 0;
        for (const element of node.elements) {
            count += countElementsRecursively(element);
        }
        return count;
    }

    return 1;
}

function normalize(p) {
    return path.normalize(p)
               .replace(/\\/g, "/")
               .toLowerCase();
}




function performDFS(entryPoint) {

    fileQueue.push(entryPoint);

    while (fileQueue.length !== 0) {

        console.log("Reading from file");

        const poppedFile = fileQueue.pop();

        console.log(poppedFile);

        if (visited.has(poppedFile))
            continue;

        visited.add(poppedFile);

        const currFileData = fs.readFileSync(poppedFile, "utf8");

        const currTree = esprima.parseModule(currFileData, {
            loc: true,
            range: true,
            tolerant: true
        });

        /**
         * SHA generation
         */
        const projectRoot = process.cwd();

        const relativePath = path.relative(
            projectRoot,
            poppedFile
        );

        const sha256Hash = crypto
            .createHash("sha256")
            .update(currFileData)
            .digest("hex");

        shaFile.push([relativePath, sha256Hash]);

        /**
         * Traverse AST
         */
        estraverse.traverse(currTree, {

            enter(node) {
                /**
                 * IMPORTS
                 */
                if (node.type === "ImportDeclaration") {

                    if (
                        node.source?.value.startsWith("./") ||
                        node.source?.value.startsWith("../")
                    ) {

                        const newFile = path.resolve(
                            path.dirname(poppedFile),
                            node.source.value
                        );

                        if (!visited.has(newFile))
                            fileQueue.push(newFile);
                    }
                }

                /**------------------------------------------
                 * VARIABLE DECLARATIOn
                 * Check for hexString
                 * -------------------------------------------
                 */
                hexStringCount = hexStringCount + testHex(node)

                if (node.type === "VariableDeclaration") {
                    //console.dir(node, {depth:null});

                    node.declarations.forEach(dec => {

                        /**
                         * Large array detection
                         */
                        if (dec.init?.elements?.length >=5) {
                            eleCount = countElementsRecursively(dec.init);
                            largeArrCount ++;
                            llmJson.push({
                                observation: "LARGE_ARRAY",
                                file: relativePath,
                                line: dec.loc?.start?.line,
                                elementCount: eleCount
                            });
                        }

                        /**
                         * const x = process.env.SECRET
                         */
                        if (
                            dec.type === "VariableDeclarator" &&
                            dec.init?.object?.object?.name === "process" &&
                            dec.init?.object?.property?.name === "env"
                        ) {

                            varTracked.add(dec.id.name);
                            llmJson.push({
                                observation: "ENVIRONMENT_VARIABLE",
                                file: relativePath,
                                line: dec.loc?.start?.line,
                                variable: dec.id.name
                            });
                        }

                        /**
                         * const {SECRET_KEY} = process.env;
                         */
                        else if (
                            dec.type === "VariableDeclarator" &&
                            dec.id?.type === "ObjectPattern" &&
                            dec.init?.object?.name === "process" &&
                            dec.init?.property?.name === "env"
                        ) {

                            dec.id.properties.forEach(prop => {
                                varTracked.add(prop.value.name);
                                    llmJson.push({
                                    observation: "ENVIRONMENT_VARIABLE",
                                    file: relativePath,
                                    line: prop.loc?.start?.line,
                                    variable: prop.value.name
                                });
                            });

                        }
                        else if(dec?.init?.type === "Literal"){
                            testHex(dec.init);
                        }
                        /**
                         * Taint anaylsis babe.
                         */
                        else if(varTracked.has(dec?.init?.name)){
                            //tainted variable!
                            //harmfullCode++;
                            varTracked.add(dec?.id?.name);
                            llmJson.push({
                                observation: "TAINTED_ENVIRONMENT_VARIABLE",
                                file: relativePath,
                                line: dec.loc?.start?.line,
                                variable: dec.id.name
                            });
                        }
                    });



                }

                /**-------------------------------------
                 * FUNCTION CALLS
                 * -------------------------------------
                 */
                else if (node.type === "CallExpression") {

                    if(node?.callee?.name == "spawn" || node?.callee?.name == "eval" || node?.callee?.object?.name == "vm") {
                        // console.dir(node, {depth:null});
                        //llmJson.push(JSON.stringify(node));
                        llmJson.push({
                            observation: "DYNAMIC_EXECUTION",
                            file: relativePath,
                            line: node.loc?.start?.line,
                            ast: node
                        });
                    }
                    if(node?.callee?.name == "exec" || node.callee?.property?.name === "exec") {
                       // console.dir(node, {depth:null});

                        if(node?.arguments){
                            node.arguments.forEach(arg => {
                                const parts = arg.value.trim().split(/\s+/);
                                const command = parts[0];
                                if(DESTRUCTIVE_COMMANDS.includes(command)){
                                    harmfullCode = harmfullCode + 1;
                                    //llmJson.push(JSON.stringify(node));
                                    llmJson.push({
                                        observation: "EXEC_COMMAND",
                                        file: relativePath,
                                        line: node.loc?.start?.line,
                                        command,
                                        ast: node
                                    });

                                }
                            })
                        }
                        // llmJson.push(JSON.stringify(node));
                    }
                    /**
                     * http.request(...)
                     * axios.post(...)
                     * etc.
                     */
                    if (
                        NET_METHODS.includes(
                            node.callee?.property?.name
                        )
                    ) {
                        networkCalls=networkCalls+1;
                        //llmJson.push(JSON.stringify(node));
                        llmJson.push({
                            observation: "NETWORK_CALL",
                            file: relativePath,
                            line: node.loc?.start?.line,
                            ast: node
                        });

                        // TODO:
                        // Inspect arguments and determine whether
                        // tracked env vars are being sent.

                    }
                    if(FILE_WRITE_APIS.includes()){

                    }
                    if (
                    node.type === "Literal" &&
                    typeof node.value === "string"
                ) {
                    literalCount++;

                    if (/\\x[0-9a-fA-F]{2}/.test(node.raw)) {
                        hexStringCount++;
                        llmJson.push({
                        observation: "HEX_STRING",
                        line: node.loc?.start?.line,
                        value: node.value
                        });
                    }
                }

                }

            }

        });

        console.log("Variable split out:");
        console.log([...varTracked]);
    }
    //console.dir(llmJson, {depth:null});
    console.log("=== AST Scan Summary ===");
    console.log("Tracked Variables:", varTracked);
    console.log("Large Array Count:", largeArrCount);
    console.log("Literal Count:", literalCount);
    console.log("Hex String Count:", hexStringCount);
    console.log("Network Calls:", networkCalls);
    console.log("Harmful Code Matches:", harmfullCode);
    console.log("Maximum Array Depth:", maxArrayDepth);
    console.log("========================");
    /**
     * Final SHA
     */
    shaFile.sort((a, b) => a[0].localeCompare(b[0]));

    console.log("Sha for each file");
    console.log(shaFile);

    const cumulativeSHA = shaFile
        .map(([file, sha]) => `${file}:${sha}`)
        .join("\n");

    const finalSHA = crypto
        .createHash("sha256")
        .update(cumulativeSHA)
        .digest("hex");

    console.log("SHA baby!");
    console.log(finalSHA);
    return {
        projectHash: finalSHA,

        fileHashes: shaFile,

        statistics: {
            networkCalls,
            harmfulCode: harmfullCode,
            largeArrayCount: largeArrCount,
            literalCount,
            hexStringCount,
            maxArrayDepth
        },

        trackedEnvironmentVariables: [...varTracked],

        observations: llmJson
    };

    // call LLM
}

/**
 * Findings - 16/06/2026
 * 
 */

/**20-06-2026
 * Cases:
 * 
 * (1) CallExpression:
 *  callee.name - exec - arguments.value valuestarts with rm (trim initially)
 *  callee.object - http - callee.property.name - request
 *  callee.object.name - fs - callee.property.name - (lets decide) -arguments.value - (trime) and - begins with /var/log/syslog
 * 
 * (2)Variable declaration:
 * if variables referencing to .env data is sent over network - flag - high risk.
 * 
 * 
 * KEEPING TRACK OF .ENV VARIABLES
 * type == VariableDeclaration
 * kind: const.
 * trackVariables - a set - now, add those variables where.
 * for each variableDeclaration init.object.object.name === process and variableDeclaration init.object.property.name === env
 * 
 * 
 * CHECK IF A NETWORK REQUEST INVOLVES ANY VARIABLE BELONGING IN TRACKVARIABLES.
 * callee.object.name === http && calleee.property.name === request --> arguments.forEach( arg => { if(arg.key.name == body){
 *  arg.properties.forEach( prop => if(prop.val.name in set) flag!);
 * }})
 * 
 */
performDFS("./test.js");
export { performDFS };