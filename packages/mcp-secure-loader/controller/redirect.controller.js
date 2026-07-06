const namespace = require("../Schema/namespaces.schema");
const async_handler = require("express-async-handler");
require("dotenv").config();

const {
GITHUB_CLIENT_ID,
GITHUB_CLIENT_SECRET
} = process.env;
const{
    verifyUserToken,
    signUserToken
} = require('../jwt');
/**
 * Accessible info:
 * user data:
{
  login: 'b-avaneesh',
  id: 181269611,
  node_id: 'U_kgDOCs30aw',
  avatar_url: 'https://avatars.githubusercontent.com/u/181269611?v=4',
  gravatar_id: '',
  url: 'https://api.github.com/users/b-avaneesh',
  html_url: 'https://github.com/b-avaneesh',
  followers_url: 'https://api.github.com/users/b-avaneesh/followers',
  following_url: 'https://api.github.com/users/b-avaneesh/following{/other_user}',
  gists_url: 'https://api.github.com/users/b-avaneesh/gists{/gist_id}',
  starred_url: 'https://api.github.com/users/b-avaneesh/starred{/owner}{/repo}',
  subscriptions_url: 'https://api.github.com/users/b-avaneesh/subscriptions',
  organizations_url: 'https://api.github.com/users/b-avaneesh/orgs',
  repos_url: 'https://api.github.com/users/b-avaneesh/repos',
  events_url: 'https://api.github.com/users/b-avaneesh/events{/privacy}',
  received_events_url: 'https://api.github.com/users/b-avaneesh/received_events',
  type: 'User',
  user_view_type: 'public',
  site_admin: false,
  name: 'Avaneesh B',
  company: null,
  blog: '',
  location: null,
  email: 'avaneeshbmit@outlook.com',
  hireable: null,
  bio: null,
  twitter_username: null,
  notification_email: 'avaneeshbmit@outlook.com',
  public_repos: 3,
  public_gists: 0,
  followers: 4,
  following: 8,
  created_at: '2024-09-11T17:49:04Z',
  updated_at: '2026-06-12T19:48:05Z'
}
 */
const githubRedirect = async_handler(async (req, res) => {
    try{
    const { code } = req.query;
    console.log("client_id:", GITHUB_CLIENT_ID);
console.log("client_secret:", GITHUB_CLIENT_SECRET);
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
    const userData = await fetch("https://api.github.com/user",{
        method: "GET",
        headers: {  
            Accept: "application/json",
            "Content-Type": "application/json",
            "Authorization" : `Bearer ${tokenData.access_token}`
        }
    })
    /**
     * Parsing resoponse into json obj.
     */
    const userJson = await userData.json();
    console.log("user data:");
    console.log(userJson);

    /**
     * Create JWT and append into DB
     */
    const jwtToken = signUserToken(userJson.email,userJson.id);

    await namespace.create({
    ownerId: String(userJson.id),
    githubUsername: userJson.login,
    email: userJson.email || null,
    emailVerified: false,
    namespace: `github.${userJson.login}`,
    });

    /**
     * (Dev - Debugging)
     */
    console.log("token received initially (the scopes, access_token etc..)");
    console.log(tokenData);

    res.redirect(`http://127.0.0.1:4242/getToken?token=${jwtToken}`);

    }catch(err){
        console.error('OAuth Error:', err);
        res.status(500).send('Authentication failed');
    }

});
/**
 * Mappings:
 * id -> ownerId
 * name -> githubUsername
 * emailVerified -> always false - until i figure out scope.
 */
module.exports = { githubRedirect };
