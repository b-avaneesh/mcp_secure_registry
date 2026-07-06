#!/usr/bin/env node

import { Command } from 'commander';
import {exec, execSync} from 'child_process';
import http  from 'http';
import open, {openApp, apps} from 'open';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import process from 'process';
import crypto from 'crypto';

/**
 * Other directory files.
 */
import { generateKey, getKeys } from './keyGenerator.js';
import { manifestSchema } from './manifestJson.validation.js';
import { writeToken, readToken } from './tokenHandler.js';
import { performDFS } from './astGenerator.js';
import { send_to_llm } from './llm.js';
/**
 * Initialising step.
 */
dotenv.config();
const program = new Command();
const { GIHUB_CLIENT_ID, REDIRECT_URI, GITHUB_URL, BACKEND } = process.env;


/**
 * Building URL
 */

/**
 * Defining tools
 */
program
  .name('my-cli')
  .description('A CLI application built with Commander.js')
  .version('1.0.0')
  .option('-d , --debug', 'output extra debugging info');


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
        const queryParams = parsedUrl.searchParams;
        

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
        else if(method == "GET" && pathname ==="/getToken"){
              const token = queryParams.get('token');
              console.log("JWT RECEIVED!");
              console.log(token);
               /**
                * Perform write into default dir.
                */
               
              writeToken(token);
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end("Closing server\n"); 
              server.close(() =>{
                console.log("Graceful exit mate!");
              })

        }
        })

        server.listen(PORT, () => {
          console.log(`\n[CLI] Local loopback server is now live and listening on http://127.0.0.1:${PORT}`);
          console.log("[CLI] Go ahead and open that URL in your browser to see your console logs activate.");
    });
      
  })


program
  .command('publish')
  .action(async ()=>{
    /**
     * (1) Apply AST - based on findings - write a comment - high risk - found --> should come from LLM.
     * (2) Send to LLM - generate scores
     * (3) Sign file, send along with JWT.
     */

    //assuming CLI to be launched in the working dir - searc
    try{

      if(!fs.existsSync(path.join(process.cwd(),"manifest.json"))) 
        throw new Error("Create manifest.json in working directory");

      /**
       * Manifest to be present outside src/ folder.
       * Present in .git directory.
       */
      const manifestFile = fs.readFileSync(path.join(process.cwd(),"manifest.json"), "utf-8");
      const manifestJSON = JSON.parse(manifestFile);

      /**
       * Perform validation
       */
      manifestSchema.parse(manifestJSON);
      const entryPath = path.join(
          process.cwd(),
          manifestJSON.entry
      );
      
      if (!fs.existsSync(entryPath)) {
          throw new Error(
              `Entry file not found: ${manifestJSON.entry}`
          );
      }

      /**
       * AST parsing
       */
        const astOutput = performDFS(entryPath); //need to delegate to worker.
        astOutput.package = {
            name: manifestJSON.name,
            version: manifestJSON.version,
            repository: manifestJSON.repository?.url,
            permissions: manifestJSON.permissions
        };        
        const response = await send_to_llm(astOutput);
        console.log("response from LLM:")
        console.log(response);


        /**
       * Retrieve commit id.
       * Generate hash.
       */

        const repositoryUrl = execSync("git config --get remote.origin.url")
          .toString()
          .trim();

        const branch = execSync("git branch --show-current")
          .toString()
          .trim();

        const commitId = execSync("git rev-parse HEAD")
          .toString()
          .trim();    

        // const tempFolder = path.join(os.tmpdir(),'mcp-cli');
        // fs.writeFileSync(tempFolder,astOutput.toString())


      /**
       * Call backend server.
       */
      await fetch()

    }catch(err){

      console.log("Error encountered! ");
      console.log(err.message);

    }



    //working on signing logic first, then proceed with AST.
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