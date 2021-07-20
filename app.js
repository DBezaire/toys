// runs in node.js
// use GIT BASH to run
// to restart automatically after changes, run with DEBUG=toys nodemon npm start
// to see more console output but have to restart manually, run with DEBUG=toys:* npm start

const appName = 'Toys';
const port = process.env.PORT || 4000;
var paths = require('./paths');
// console.log(`in app.js-`);
// console.log(paths);

var express = require('express');
var app = express();

// var logger = require('morgan');
// app.use(logger('dev', {skip: function (req, res) { return res.statusCode != 400 }}));

// Use of the 'sprightly' template system.
// Templates are simple html with two tag types:
// -- <<./path>> for files that contain a partial template
// -- {{name}} for variables passed in at render time where 
//      'name' is a property of the object passed in.
// Use extension '.spy'.
var sprightly = require('sprightly'); // npm module for sprightly template functions
app.engine('spy', sprightly); // associates extension 'spy' with sprightly module
app.set ('view engine', 'spy'); // tell app.render() to use default extension 'spy'
app.set ('views', paths.views); // tell app.render() to look in folder 'views' for the .spy files

//app.use(express.json());
//app.use(express.urlencoded({ extended: false }));

// var cookieParser = require('cookie-parser');
//app.use(cookieParser());

// Register a folder that files (i.e. not rendered views) 
// are served from
app.use('/static', express.static(paths.static));

// Register a function to be called for every request
var multiRouter = require('./routes/multi-router');
app.use('*', multiRouter);

// Register a function to be called for every non-recognized request
var errorFunction = require('./routes/error-function');
app.use(errorFunction);

// Start the server
app.listen(
    port // note that function gets from process environment for running on heroku where using constant fails
  , () => { // function runs when successfully started
      console.log(`${appName} listening on port: ${port}`);
    }
  )
;

module.exports = app;
