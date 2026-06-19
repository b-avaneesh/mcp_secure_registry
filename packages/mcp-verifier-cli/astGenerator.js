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
performDFS("./test.js");
export { performDFS };