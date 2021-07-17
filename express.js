const express = require('express');
const app = express();

const server = app.listen(7000, () => {
  console.log(`Express listening on port: ${server.address().port}`);
});