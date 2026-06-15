#!/usr/bin/env node

import { Command } from 'commander';
import {exec} from 'child_process';
import http  from 'http';
import open, {openApp, apps} from 'open';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Other directory files.
 */
import { generateKey, getKeys } from './keyGenerator.js';
/**
 * Initialising step.
 */
dotenv.config();
const program = new Command();
const { GIHUB_CLIENT_ID, REDIRECT_URI, GITHUB_URL } = process.env;


/**
 * Building URL
 */

const github_url = ` https://github.com/login/oauth/authorize?client_id=${GIHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}`
/**
 * Defining tools
 */
program
  .name('my-cli')
  .description('A CLI application built with Commander.js')
  .version('1.0.0')
  .option('-d , --debug', 'output extra debugging info');

// program
//   .command('dir')
//   .description('Testing fs library')
//   .action( () =>{
//     console.log(os.homedir());
//     /**
//      * In ES modules - __dirname doesnt work
//      * Convert to path using fileURLToPath or make use of URL - URL(relative,base) - effectively drops off the 
//      * .ext of files as well - only pertains directory
//      */

//     const configDir = path.join(os.homedir(), '.config', 'mcp-verifier');
//     const pubPath = configDir+'/id_ed25519.pub';
//     const privPath = configDir+'/id_ed25519';

//     try{  
//       const pubKey = fs.readFileSync(pubPath, { encoding: 'utf8', flag: 'r' });
//       const privKey = fs.readFileSync(privPath, { encoding: 'utf8', flag: 'r' });

//       console.log("Private and public key exists reusing them..");
//       console.log(pubKey);
//       console.log(privKey);

//     }
//     catch(err){
//       /**
//        * If the folders/file doesnt exist - then generate pair.
//        */
//       if(!fs.existsSync(configDir)){
//           console.log("Bam path isnt found so we cannot read");
//           fs.mkdirSync(configDir);
//       }

//       const {pubKey , privKey} = generateKey();
//       fs.writeFileSync(pubPath, pubKey); 
//       fs.writeFileSync(privPath, privKey); 
//     }

//   })

// program
//   .command('chrome')
//   .description("Testing out OPEN library safely")
//   .action(() => {
//     /**
//      * Opens in default browser of user.
//      */
//     console.log("Opening github auth page please wait...")
//     switch(process.platform){
//       /**
//        * Process.platform - provides the current OS in use.
//        */
//       case "win32":
//         exec(`start ${GITHUB_URL}`);
//         break;
//       case "darwin":
//         exec(`open "${GITHUB_URL}"`);
//         break;
//       default:
//         exec(`xdg-open "${GITHUB_URL}"`);
//     }

//   });
 /**
  * To merge the chrome code with login, add key generation.
  */
program
  .command('Login')
  .description("User login through GitHub OAuth")
  .action(async() =>{
      const PORT = 4242;

      /**
       * Open login page - iff JWT doesn't exist. (to be implemented soon)
       * if(!getJWT()) then login.
       */
      openLogin();

      /**
       * Retrieve keys regardles of what happens in login.
       */
      const {privKey, pubKey} = getKeys();

      const server = http.createServer(async (req,res) =>{ //creates a http server and returns object.
        /**
         * req has the structure
         * GET /auth/blah.... HTTP 1.1
         * Host: 127.x.x.x..
         * User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X...)
         * Content-type: application/json
         * 
         * Tricky part - Node js truncats the domain from url, so effectively req.url only has /auth/blah...
         * Needs the entire URL for constructing a response.
         */
        const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
        const pathname = parsedUrl.pathname; //the endpoint path - same as req.url
        const method = req.method;

        if(method == "GET" && pathname == "/trial/testing"){
              res.writeHead(200, { 'Content-Type': 'text/plain' });
              res.end("CLI captured the request context cleanly!\n"); 
              /**
               * expects the payload to be string only.
               * res.end() vs res.write() - latter keeps the connection open, .end() closes end once the payload has been dispatched.
               */
              
              server.close(() =>{
                console.log("Graceful exit mate!");
              })
        }
        else{
          /**
           * to catch requests to invalid endpoints.
           */
          res.writeHead(404,{"Content-Type":"text/plain"});
          res.end("Hey mate reached a undefined endpoint");
        }
        })

        server.listen(PORT, () => {
          console.log(`\n[CLI] Local loopback server is now live and listening on http://127.0.0.1:${PORT}`);
          console.log("[CLI] Go ahead and open that URL in your browser to see your console logs activate.");
    });
      
  })
// const options = program.opts();
// if(options.ava){
    
//     console.log("Handsome intelligent dude");
//     console.log('Options:', options);

// }

program
  .command('upload')
  .action(()=>{
    /**
     * (1) Apply AST - based on findings - write a comment - high risk - found --> should come from LLM.
     * (2) Send to LLM - generate scores
     * (3) Sign file, send along with JWT.
     */
  })

program.parse(process.argv);


function openLogin(){
      /**
     * Opens in default browser of user.
     */
    console.log("Opening github auth page please wait...")
    switch(process.platform){
      /**
       * Process.platform - provides the current OS in use.
       */
      case "win32":
        exec(`start ${GITHUB_URL}`);
        break;
      case "darwin":
        exec(`open "${GITHUB_URL}"`);
        break;
      default:
        exec(`xdg-open "${GITHUB_URL}"`);
    }
}