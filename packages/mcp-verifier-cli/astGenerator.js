import AST from 'abstract-syntax-tree';
const { parse, find } = AST;
import fs from 'fs';
import path from 'path';
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
function performDFS(entryPoint){


    let fileQueue = []; //the stack
    const visited = new Set();

    fileQueue.push(entryPoint);

    while(fileQueue.length != 0){

        /**
         * Pop file dir from stack, read from file and generate tree.
         */
        const poppedFile = fileQueue.pop();
        if(visited.has(poppedFile)) continue;
        visited.add(poppedFile);
        
        const currFileData = fs.readFileSync(poppedFile, "utf8");
        const currTree = parse(currFileData);

        // console.dir(currTree,{depth:null});

        const importDeclarations = find(currTree, { type: 'ImportDeclaration' });
        const variableDeclarations = find(currTree, { type: 'VariableDeclaration' });
        const callExpressions = find(currTree, { type: 'CallExpression' });

        const imports = [...importDeclarations, ...variableDeclarations];

        console.dir(callExpressions,{depth:null});
        console.log("...");
        console.log("Now variable decl.")
        console.dir(variableDeclarations,{depth:null});

        /**
         * Extract the imports push them into stack - high priority
         */
        imports.forEach((imp) =>{
        if(imp?.source?.value.startsWith("./") || imp?.source?.value.startsWith("../")){

            //in this case push it into the file queue.
            const newFile = path.resolve(path.dirname(poppedFile),imp.source.value)

            if(!visited.has(newFile)) {
                fileQueue.push(newFile);
            }

        }
        //Common js implementation.
        // if(imp?.declarations[0]?.init?.callee == 'require' && (imp?.declarations[0]?.init?.arguments?.value.startsWith == './'  || imp?.declarations[0]?.init?.arguments?.value.startsWith == '../' ))
        // {

        // }
        /**
         * Process file for specific line of codes like 
         */

    })
    }
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