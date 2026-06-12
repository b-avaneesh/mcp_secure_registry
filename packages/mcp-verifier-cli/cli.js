#!/usr/bin/env node

import { Command } from 'commander';
import {exec} from 'child_process';
import http  from 'http';
import open, {openApp, apps} from 'open';
import dotenv from 'dotenv';


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

program
  .command('chrome')
  .description("Testing out OPEN library safely")
  .action(() => {
    /**
     * Opens in default browser of user.
     */
    console.log("Opening github auth page please wait...")
    switch(process.platform){
      case "win32":
        exec(`start ${GITHUB_URL}`);
        break;
      case "darwin":
        exec(`open "${GITHUB_URL}"`);
        break;
      default:
        exec(`xdg-open "${GITHUB_URL}"`);
    }

  });
 /**
  * To merge the chrome code with login, add key generation.
  */
program
  .command('Login')
  .description("User login through GitHub OAuth")
  .action(async() =>{
      const PORT = 4242;

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

program.parse(process.argv);
