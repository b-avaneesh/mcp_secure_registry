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
import { generateKey, getKeys, privPath, pubPath } from './keyGenerator.js';
import { POST_PUB_KEY,
    PUBLISH_URI,
    GET_PUBLIC_KEY,
    DOWNLOAD_PROJECT_URI} from './cli_config/cli.config.js';
import { manifestSchema } from './manifestJson.validation.js';
import { writeToken, readToken } from './tokenHandler.js';
import { performDFS } from './astGenerator.js';
import { send_to_llm } from './llm.js';
import {checkIntegrity, checkManifest} from './integrity.js'
/**
 * Initialising step.
 */
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: path.join(__dirname, ".env")
});

const program = new Command();
const { SECRET_KEY, GIHUB_CLIENT_ID, REDIRECT_URI, GITHUB_URL, BACKEND } = process.env;



/**
 * Building URL
 */

/**
 * Defining tools
 */
program
  .name("mcp-secure-registry")
  .description(`
╔══════════════════════════════════════════════════════════════╗
║                 MCP Secure Registry CLI                     ║
║                                                              ║
║  Cryptographically verify • Publish • Download • Trust      ║
╚══════════════════════════════════════════════════════════════╝

Secure package publishing and verification for MCP servers.
Every package is signed, verified, and security reviewed before use.
`)
  .version("1.0.0", "-v, --version", "Show CLI version")
  .helpOption("-h, --help", "Display help menu")
  .option("-d, --debug", "Enable verbose debug logging");


program
  .command('login')
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
              console.log("getting keys - dtype");
              console.log(typeof pubKey);
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
              const jwt = readToken();

              /**
               * Send details - about public key
               */

              
              const publicKeyData = {
                publicKey : pubKey
              }
              await fetch(POST_PUB_KEY, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`
                },
                body: JSON.stringify(publicKeyData)
              });      

            /**
             * Exit
             */
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

         /**
         * Manifest Json Hash. - Buffer doesn't take json objects as input!
         */
        const manifestHash = crypto.createHash('sha256').update(Buffer.from(JSON.stringify(manifestJSON))).digest('hex');

        /**
         * Private key is encrypted with secret need to retrieve it first.
         */
        const {privKey, pubKey} = getKeys();
        console.log(typeof privKey)

        const actualPrivKey = crypto.createPrivateKey({
            key: fs.readFileSync(privPath, "utf8"),
            format: "pem",
            passphrase: SECRET_KEY //was passed in key generation as well, so need to get encrypted key and decrypt from file.
        });


        const signature = crypto.sign(
          null,
          Buffer.from(astOutput.projectHash,"hex"),
          actualPrivKey
        ).toString("base64");

        const response = await send_to_llm(astOutput);
        /**
         * Converting .md to JSON - interactions may not support structured output or return in json format.
         */
        const cleaned = response
            .trim()
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/, "");

        const llmResponse = JSON.parse(cleaned);
        const security = {
            verdict: llmResponse?.verdict,
            riskScore: llmResponse?.riskScore,
            riskLevel: llmResponse?.riskLevel,
            permissionsMatch: llmResponse?.permissionsMatch,
            missingPermissions: llmResponse?.missingPermissions,
            unnecessaryPermissions: llmResponse?.unnecessaryPermissions,
            findings: llmResponse?.findings
        };
        // console.log("Security Review:");
        // console.log(security);

        /**
       * Retrieve commit id.
       * Generate hash.
       */
       const jwt = readToken();
        const repositoryUrl = execSync("git config --get remote.origin.url")
          .toString()
          .trim();

        const branch = execSync("git branch --show-current")
          .toString()
          .trim();

        const commitId = execSync("git rev-parse HEAD")
          .toString()
          .trim();    

          const publishPayload = {
            packageName: manifestJSON?.name,
            version: manifestJSON?.version,
            description: manifestJSON?.description,
            entry: manifestJSON?.entry,
            repository: {
                url: repositoryUrl,
                branch
            },

            commitId,

            permissions: manifestJSON?.permissions,

            manifest: manifestJSON,
            manifestHash,
            signature,

            security
        };

        console.log("payload sent");
        const body = JSON.stringify(publishPayload);
        console.log(body);
      /**
       * Call backend server.
       */
      console.log("sending to server...");
      console.log("jwt");
      console.log(jwt);
      console.log(PUBLISH_URI);
      const backendResponse = await fetch(PUBLISH_URI, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${jwt}`
            },
            body: JSON.stringify(publishPayload)
        });      

    console.log(await backendResponse.json());
    
    }catch(err){

      console.log("Error encountered! ");
      console.log(err.message);

    }



    //working on signing logic first, then proceed with AST.
  })


program
    .command("download <project_name> <GitHub_username> <project_version>")
    .action(async (projectName, devName, userVersion) => {

        const tempDir = path.join(
            os.tmpdir(),
            "mcp_downloads",
            `${projectName}_${devName}_${crypto.randomUUID()}`
        );

        fs.mkdirSync(tempDir, { recursive: true });

        try {

            /**
             * Fetch package metadata
             */
            const response = await fetch(DOWNLOAD_PROJECT_URI, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    packageName: projectName,
                    githubUsername: devName,
                    version: userVersion
                })
            });
            if (!response.ok)
              throw new Error("Failed to fetch package metadata.");

            const audit = await response.json();

            const {
                repository,
                signature,
                commitId
            } = audit;
            console.log("Dev debug -----")
            console.log(audit);
            console.log("Debug ends ----")
            const {
                url,
               branch,
            } = repository;

            /**
             * Clone project
             */

            execSync(
                `git clone --branch ${branch} "${url}" "${tempDir}"`,
                {
                    stdio: "inherit"
                }
            );


            execSync(
                `git -C "${tempDir}" checkout ${commitId}`,
                {
                    stdio: "inherit"
                }
            );

            /**
             * Verify project integrity
             */
            let integrity;
            try{
              integrity = checkIntegrity(tempDir, audit);
              console.log("final sha");
              console.log(integrity.projectHash);

            }catch(err){
              console.log(err.message);
              return;
            } 

            /**
             * Fetch developer public key
             */
            const responseKey = await fetch(GET_PUBLIC_KEY, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    githubUsername: devName
                })
            });


          if (!responseKey.ok)
              throw new Error("Failed to fetch public key.");
  
            const { publicKey } = await responseKey.json();
            console.log("public key:")
            console.log(publicKey)

            /**
             * Verify signature
             */
            const verified = crypto.verify(
                null,
                Buffer.from(integrity.projectHash, "hex"),
                publicKey,
                Buffer.from(signature, "base64")
            );

            if (!verified) {
                throw new Error("Signature verification failed.");
            }

            console.log("✓ Integrity verified.");
            console.log("✓ Signature verified.");

            /**
             * Install project
             * (We'll decide later whether to move or clone again.)
             */

        } catch (err) {

            console.error(err.message);

        } finally {

            fs.rmSync(tempDir, {
                recursive: true,
                force: true
            });

        }

    });

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