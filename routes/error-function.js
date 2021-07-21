// function that handles requests we don't recognize 
// the fact that the callback has 4 arguments tells express it is an error handler

var errorFunction = function(error, request, response, next) {
  // log error to console
  // console.group(`\nfor request ${request.originalUrl} at ${new Date().toLocaleString()}`)
  // console.log(error.valueOf());
  // console.groupEnd();
  
  // send response
  response
    .status(500) // send HTML stats 500
    .render(
        './partials/error' // render template 'error.spy' from /views/partials
      , {errorInfo: error.message} // inject object with property 'errorInfo'
    );
}

module.exports = errorFunction;