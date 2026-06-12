const namespace = require("../namespaces.schema");
const async_handler = require("async-handler")

const githubRedirect = async_handler((req,res) =>{
    console.log("You've reached redirect page");
    res.status(200);
    res.json({
        msg : "Redirect page for GitHub OAuth"
    });
})

module.exports = { githubRedirect}