// Very simple router that uses the BASEURL as the name of the template to be rendered. 
// BASEURL is the portion immediately following the domain 
// as in http://localhost:3000/BASEURL or http://toys-dlb.herokuapp.com/BASEURL.

var express = require('express'); // node.js module that handles website routing
var router = express.Router(); // an express middleware object that gets used for handling requests

// Define what this router does for GET requests.
// Since it doesn't handle other methods like POST, DELETE, UPDATE, etc., they fall thru to errorFunction.
// Also falls thru to errorFunction if there is no template named BASEURL.
router.get(
    '*' // match any path i.e. BASEURL
  , function(request, response, next) { // calls this function for requests with matching BASEURL
      // log request
      console.log(`request: ${request.originalUrl} at ${new Date().toLocaleString()}`);
      
      // send response
      let variableData = {
        added: `${request.baseUrl.slice(1)}`, 
        time:new Date(),
      }
      response
        .render(  // render template using default view engine
            request.baseUrl.slice(1) // template name is BASEURL less leading slash; uses default extention
          , variableData // inject variable data
        )
      ;
    }
  )
;

// export it
module.exports = router;
