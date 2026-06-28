/**
 * (AST parsing and checking post this flow happens)
 */
import fs from 'fs';
import path from 'path';
import process from 'process';

/**
 * Other directory files.
 */
import { generateKey, getKeys } from './keyGenerator.js';


/**
 * Bundle entire project into /dist
 */
function bundleProject(){
    /**
     * Go simply run npm run build - if not found - prompt user to add into package.json
     */
    try{
    const cwd = process.cwd();
    const packageJsonPath = path.join(cwd, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        throw new Error(
            "package.json not found. Run this command from the project root."
        );
    }

    const pkg = JSON.parse(
    fs.readFileSync(packageJsonPath, "utf8")
    );

    if (!pkg.scripts?.build) {
        throw new Error(
            "No build script found in package.json."
        );
    }
    /**
     * Bundle up! - invoke child process to finish up bundling.
     */
    execSync("npm run build", {
        cwd,
        stdio: "inherit"
    });

    const distPath = path.join(cwd, "dist");

    if (!fs.existsSync(distPath)) {
        console.warn(
            "Build succeeded but no dist folder was found."
        );
    }

    }catch(e){
        console.log(e.message);
    }
}


/**
 * Takes the /dist as input - recursively generate sha for each of the files present in the bundle.
 */
function generateSHA(){
    try{
        const cwd = process.cwd();
        const dist = path.join(cwd,"./dist")
        

    }catch(err){

    }
}
/**
 * 
 * @param {*} shaVal 
 * Retrieves keys from default path - uses private keys to sign the SHA.
 */
function signWithAlgo(shaVal){
      const {privKey, pubKey} = getKeys();
      
}
export{
    bundleProject,
    generateSHA
}