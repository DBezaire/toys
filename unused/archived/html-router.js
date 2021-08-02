// Very simple router that serves html files

// turns out this was not needed, and never completed
// the code below was not exercised because
// the express.static route serves html files directly

// therefore, what is seen below is just a concept that was never developed.

var express = require('express'); // node.js module that handles website routing
var router = express.Router(); // an express middleware object that gets used for handling requests

// Define what this router does for GET requests.
// Since it doesn't handle other methods like POST, DELETE, UPDATE, etc., they fall thru to errorFunction.
// Also falls thru to errorFunction if there is no file named BASEURL.
router.get(
    '*' // match any path i.e. BASEURL
  , function(request, response, next) { // calls this function for requests with matching BASEURL
      // log request
      console.log(`by htmlRouter - request: ${request.originalUrl} at ${new Date().toLocaleString()}`);
      console.log(request);
      
      // send response
      let fileName = '/animation-kirupa/1-css-animations.html';
      response
        .sendFile(
            fileName  // file to send
          , {root: './static/html'} // options
          , function (err) { // function called on errors
              if (err) {
                console.log(err); // log error
                next(err); // pass it along
              } else {
                console.log(`htmlRouter sent ${fileName}`);
              }
            }
        )
      ;
    }
  )
;

// export it
module.exports = router;
