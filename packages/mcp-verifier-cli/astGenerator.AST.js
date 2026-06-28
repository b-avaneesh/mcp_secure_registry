function performDFS(entryPoint){
    /**
     * SHA TRACKING
     */
    let shaFile = [];

    /**
     * FILE TRACKING
     */
    let fileQueue = []; //the stack
    const visited = new Set();

    /**
     * FLAG VAR
     */
    let varTracked = [];
    let largeArrCount = 0;

    let flagged = [];
    let allEnv = [];
    fileQueue.push(entryPoint);

    while(fileQueue.length != 0){

        /**
         * Pop file dir from stack, read from file and generate tree.
         */
        console.log("Reading from file");
        
        const poppedFile = fileQueue.pop();
        console.log(poppedFile);

        if(visited.has(poppedFile)) continue;
        visited.add(poppedFile);
        
        const currFileData = fs.readFileSync(poppedFile, "utf8");
        const currTree = parse(currFileData);
        /**
         * Perform Hash generation as well.
         */
        const projectRoot = process.cwd();
        const relativePath = path.relative(
            projectRoot,
            poppedFile
        );
        const sha256Hash = crypto.createHash('sha256').update(currFileData).digest('hex');
        shaFile.push([relativePath,sha256Hash]);

        // console.dir(currTree,{depth:null});

        const importDeclarations = find(currTree, { type: 'ImportDeclaration' });
        const variableDeclarations = find(currTree, { type: 'VariableDeclaration' });
        const callExpressions = find(currTree, { type: 'CallExpression' });

        const imports = [...importDeclarations];
        // console.dir(importDeclarations,{depth:null});
        // console.log("...");
        // console.log("Now callExpressions decl.")
        // console.dir(callExpressions,{depth:null});
        // console.log("...");
        // console.log("Now variable decl.")
        // console.dir(variableDeclarations,{depth:null});

        /**
         * Done! - Imports working perfectly.
         */
        /**
         * Extract the imports push them into stack - high priority
         */
        imports.forEach((imp) =>{
            // console.dir(imp,{depth:null})
            // console.log("...")
        if(imp?.source?.value.startsWith("./") || imp?.source?.value.startsWith("../")){

            //in this case push it into the file queue.
            const newFile = path.resolve(path.dirname(poppedFile),imp.source.value)

            if(!visited.has(newFile)) {
                fileQueue.push(newFile);


            }

        }
        })

        const currVar = [...variableDeclarations];

        currVar.forEach( (variable) => {
            if(variable?.declarations){
                /**
                 * Array - large arrays - usually sign for malware / sus activity.
                 */

                variable.declarations.forEach( (dec) => {
                    if(dec?.init?.elements){
                        if(dec?.init?.type == "ArrayExpression" && dec?.init?.elements.length >=50){
                            largeArrCount = largeArrCount + countElementsRecursively(dec.init);
                        }
                    }
                    //single import or const x = process.env.whatver
                    if(dec.type == "VariableDeclarator" && dec.init?.object?.object?.name == "process" && dec.init?.object?.property?.name == "env"){
                        varTracked.push(dec.id.name);
                    }

                    /**
                     * Common import
                     * const {IDK,EXAMPLE} = process.env;
                     */
                    else if(dec.type == "VariableDeclarator" && 
                        dec.id?.type == "ObjectPattern" && dec?.init?.object?.name == "process" && dec?.init?.property?.name == "env"){
                        /**
                         * Then - we have array of properties.
                         *         properties: [
                                                {
                                                    type: 'Property',
                                                    key: { type: 'Identifier', name: 'SECRET_KEY' },
                                                    value: { type: 'Identifier', name: 'SECRET_KEY' },
                                                    kind: 'init',
                                                    computed: false,
                                                    method: false,
                                                    shorthand: true
                                                },
                                                {
                                                    type: 'Property',
                                                    key: { type: 'Identifier', name: 'SOMETHING_ELSE' },
                                                    value: { type: 'Identifier', name: 'SOMETHING_ELSE' },
                                                    kind: 'init',
                                                    computed: false,
                                                    method: false,
                                                    shorthand: true
                                                }
                                                ]
                                            }
                         */
                        if(dec?.id?.properties){
                            dec.id.properties.forEach( prop => {
                                varTracked.push(prop.value.name);
                            })
                        }
                    }
                })
            }
            console.dir(variable, {depth:null});
            // if(variable.init.object.object.name === process && variable.init.object.property.name === env){
            //     varTracked.add(variable.id.name);
            // }
        })
        console.log("Variable split out:")
        console.log(varTracked);
        //Common js implementation.
        // if(imp?.declarations[0]?.init?.callee == 'require' && (imp?.declarations[0]?.init?.arguments?.value.startsWith == './'  || imp?.declarations[0]?.init?.arguments?.value.startsWith == '../' ))
        // {

        // }
        /**
         * Process file for specific line of codes like 
         */

        

        /**
         * Function call / dynamic calls present here.
         */
        const currFunc = [...callExpressions];
        currFunc.forEach( (fnCall) => {
            //console.dir(fnCall, {depth:null})
            /**
             * Starting off with object member calls - like http.request etc.. - track if .env variables being sent over this.
             */
            if(fnCall?.callee?.object?.property in NET_METHODS){
                /**
                 * If this involves any of the .env then add to flagged list.
                 */

            }
        })
    }
    /**
     * Perform final SHA generation - over which encryption happens - only after LLM rating.
     * Lexicographical ordering - so that SHA remains the same.
     */
    shaFile.sort((a,b) => a[0].localeCompare(b[0]));
    console.log("Sha for each file");
    console.log(shaFile)
    const cumulativeSHA = shaFile.map(([file,sha]) => `${file}:${sha}`).join('\n');
    const finalSHA = crypto
    .createHash("sha256")
    .update(cumulativeSHA)
    .digest("hex");
    console.log("SHA baby!")
    console.log(finalSHA);
    //call LLM attach findings - post which we generate key.
}