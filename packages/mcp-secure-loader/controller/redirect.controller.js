const namespace = require("../namespaces.schema");
const async_handler = require("async-handler");
require("dotenv").config();

const {
GITHUB_CLIENT_ID,
GITHUB_CLIENT_SECRET
} = process.env;

const githubRedirect = async_handler(async (req, res) => {
    const { code } = req.query;

    if (!code) {
    return res.status(400).json({
    msg: "Authorization code missing"
    });
    }
    /**
     * Explicitly mentioning body instead of query params.
     * await fetch({URI,
     * method - post
     * headers:{
     *  Content-type:,
     *  Accept:
     * },
     * body: Json.{
     * }
     * })
     * 
     * The returned object is a HTTP object - have to type cast into JSON.
     */
    const tokenResponse = await fetch(
    "https://github.com/login/oauth/access_token",
    {
    method: "POST",
    headers: {  
        Accept: "application/json",
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code
    })
    }
    );

    const tokenData = await tokenResponse.json();
    /**
     * Need to perform - data fetch from GitHub
     */
    console.log(tokenData);

    res.status(200).json({
    msg: "OAuth token received",
    tokenData
    });
});

module.exports = { githubRedirect };
