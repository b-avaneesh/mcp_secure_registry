import os from 'os';
import fs from 'fs';
import path from 'path';
// import dotenv from 'dotenv';
// dotenv.config();
const { SECRET_KEY, GIHUB_CLIENT_ID, REDIRECT_URI, GITHUB_URL, BACKEND, PUBLISH_URI } = process.env;

const CONFIG_DIR = path.join(os.homedir(),'.config','mcp-verifier');
const CONFIG_FILE_PATH = path.join(CONFIG_DIR, 'config.json');

/**
 * Writes into config.json file
 */
function writeToken(token){
    /**
     * Check if file exists in first place.
     */
    if(fs.existsSync(CONFIG_DIR)){
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const configData = {
      token: token,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configData, null, 2), 'utf-8');

    console.log("Token received successfully!");
}

function readToken(){
    if(!fs.existsSync(CONFIG_DIR)){
        console.log("JWT doesn't exist. Perform login first!");
    }
    const data = fs.readFileSync(CONFIG_FILE_PATH, {flag:'r', encoding:'utf-8'});
    const { token, updatedAt } = JSON.parse(data);
    console.log(`Latest jwt update: ${updatedAt}`);
    return token;
}


export{
    writeToken,
    readToken
}