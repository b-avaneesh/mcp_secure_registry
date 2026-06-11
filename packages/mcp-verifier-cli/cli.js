#!/usr/bin/env node

import { Command } from 'commander';
import http  from 'http';
const program = new Command();

//adding tools / options.
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

      const server = http.createServer((req,res) =>{ //creates a http server and returns object.
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
        const pathname = parsedUrl.pathname; //the endpoint path
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
const options = program.opts();
if(options.ava){
    
    console.log("Handsome intelligent dude");
    console.log('Options:', options);

}

program.parse(process.argv);
