const express = require('express');
const app = express();
const port = 4000;

app
  .get('/', (req, res) => res.send("got this served"))
  .get('/times', (req, res) => res.send(showTimes()))
  .listen(port, () => console.log(`Express listening on port: ${port}`))
;

showTimes = () => {
  let result  = '';
  const times = process.env.TIMES || 5;
  for (i = 0; i < times; i++) {
    result += i + ' ';
  }
  return result;
}