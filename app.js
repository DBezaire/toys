// runs in node.js
// to run in GIT BASE, use "heroku local" to run (gets command from package.json)
// to run in GIT BASH, use "node app.js"
// to run and restart automatically after changes in GIT BASE, use "nodemon npm start" (or just "nodemon" and gets command from package.json)
// to run and restart automatically after changes and control MORGAN logging in GIT BASE, use "DEBUG=toys:* nodemon npm start"

const appName = 'Toys';
const port = process.env.PORT || 4000; // get from env on heroku and supply constant on local machine

var paths = require('./paths');
// console.log(`in app.js-`);
// console.log(paths);

var express = require('express');
var app = express();

////////
//////// these were included with boilerplate, but don't seem needed now
////////
// var logger = require('morgan');
// app.use(logger('dev', {skip: function (req, res) { return res.statusCode != 400 }}));
//
//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));
//
// var cookieParser = require('cookie-parser');
//app.use(cookieParser());
//
////////
////////
////////

// Register use of the 'sprightly' template system.
// Templates are simple html with two tag types:
// -- <<./path>> for files that contain a partial template
// -- {{name}} for variables passed in at render time where 
//      'name' is a property of the object passed in.
// Use extension '.spy'.
var sprightly = require('sprightly'); // npm module for sprightly template functions
app.engine('spy', sprightly); // associates extension 'spy' with sprightly module
app.set ('view engine', 'spy'); // tell app.render() to use default extension 'spy'
app.set ('views', paths.views); // tell app.render() to look in folder 'views' for the .spy files


/* 
// Register a function that returns Access-Control-Allow-Origin header
// with sound file
var corsRouter = require('./routes/cors-headers');
app.use(corsRouter);

 */
// Register a folder from which to serve files (i.e. not rendered views) 
app.use('/static', express.static(paths.static));

// Register a function to be called for every request
// which responds to RECOGNIZED requests 
var multiRouter = require('./routes/multi-router');
app.use('*', multiRouter);

// Register a function to be called for every error
// which responds to NON-RECOGNIZED requests
var errorFunction = require('./routes/error-function');
app.use(errorFunction);

// Start the server
app.listen(
    port // from process environment for heroku or constant on local machine
  , () => { // function runs when successfully started
      console.log(`${appName} listening on port: ${port}`);
    }
  )
;

module.exports = app;
