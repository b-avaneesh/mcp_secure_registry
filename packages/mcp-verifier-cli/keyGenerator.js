import fs from 'fs';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { generateKeyPairSync } from 'crypto';

const { SECRET_KEY } = process.env;

function generateKey() {
  if (!SECRET_KEY) {
    throw new Error("SECRET_KEY environment variable is missing.");
  }

  try {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
      // Public Key configuration 
      publicKeyEncoding: {
        type: 'spki',    // Must be 'spki' for Ed25519 public keys
        format: 'pem',
      },
      // Private Key configuration
      privateKeyEncoding: {
        type: 'pkcs8',   // Must be 'pkcs8' for Ed25519 private keys
        format: 'pem',
        cipher: 'aes-256-cbc',
        passphrase: SECRET_KEY,
      },
    });

    console.log(`Public key generated successfully.`);
    return { pubKey: publicKey, privKey: privateKey };
    
  } catch (err) {
    console.error("Error generating key pair:", err);
    throw err;
  }
}

function getKeys(){
    console.log(os.homedir());
    /**
     * In ES modules - __dirname doesnt work
     * Convert to path using fileURLToPath or make use of URL - URL(relative,base) - effectively drops off the 
     * .ext of files as well - only pertains directory
     */

    const configDir = path.join(os.homedir(), '.config', 'mcp-verifier');
    const pubPath = path.join(configDir, 'id_ed25519.pub');
    const privPath = path.join(configDir, 'id_ed25519');

    try{  
        const pubKey = fs.readFileSync(pubPath, { encoding: 'utf8', flag: 'r' });
        const privKey = fs.readFileSync(privPath, { encoding: 'utf8', flag: 'r' });

        console.log("Private and public key exists reusing them..");
        console.log(pubKey);
        console.log(privKey);

        return { pubKey: pubKey, privKey: privKey };


    }
    catch(err){
        /**
         * If the folders/file doesnt exist - then generate pair and return pair.
         */
        if(!fs.existsSync(configDir)){ //folder doesn't exist - create folder.
            console.log("Creating directory to store keys....");
            fs.mkdirSync(configDir, { recursive: true });
        }

        //generate keys.
        const {pubKey , privKey} = generateKey();
        fs.writeFileSync(pubPath, pubKey); 
        fs.writeFileSync(privPath, privKey); 

        //return keys
        return { pubKey: pubKey, privKey: privKey };
    }
}


// Corrected module export syntax
export { generateKey, getKeys };