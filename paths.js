var path = require('path');

var paths = {};
paths.static = path.join(__dirname, 'static'); // absolute path to static
paths.views = path.join('./views'); // relative path to views

// console.log(`in paths.js-`);
// console.log(paths);

module.exports = paths;
