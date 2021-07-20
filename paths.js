var path = require('path');

var paths = {};
paths.static = path.join(__dirname, 'static');
paths.views = path.join('./views');

// console.log(`in paths.js-`);
// console.log(paths);

module.exports = paths;
