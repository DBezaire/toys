// middleware function for express that adds
// an "Access-Control-Allow-Origin *" header with
// a sound file. This was to allow cross domain request
// from version running on localhost to obtain the file
// from heroku. It seemed that this was needed because
// of inability to access the file from the file system.
// However, by making the request for the resource a relative link 
// (e.g., ./static/sounds/....) the file is properly served from
// the localhost. Therefore, there is no need to obtain it from
// heroku. Therefore there is no need for this routine.
// So it is shuffled off to the "unused" folder in case
// ever need to refer to it in future.

module.exports = (request, response, next) => {
  if (request.method == 'GET' && request.url.indexOf('hihat.wav') > 0) {
    console.log('added CORS header');
    response.setHeader("Access-Control-Allow-Origin", '*');
  }
  return next(); // Pass to next layer of middleware
};
