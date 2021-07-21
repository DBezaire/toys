
module.exports = (req, res, next) => {
  // console.log('\n'.repeat(2));
  console.log(req.url, req.method); //, req.headers);
  // if (req.headers.origin) {
    if (req.method == 'GET' && req.url.indexOf('hihat.wav') > 0) {
    // add the remote domain or only the environment
    // listed on the configuration

    console.log('added CORS header');
    res.setHeader(
      "Access-Control-Allow-Origin",
      // process.env.domain || req.headers.origin
      '*'
    );

  }

  // Request methods you wish to allow
  // remove the methods you wish to block
  // res.setHeader(
    // "Access-Control-Allow-Methods",
    // "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  // );

  // Request headers you wish to allow
  // res.setHeader(
    // "Access-Control-Allow-Headers",
    // "Origin,Authorization,X-Requested-With,content-type,Accept"
  // );

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  // res.setHeader("Access-Control-Allow-Credentials", true);

  // if ("OPTIONS" === req.method) {
    // return res.sendStatus(200);
  // }

  return next(); // Pass to next layer of middleware
};
