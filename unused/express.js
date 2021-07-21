const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app
  .get('/', (req, res) => res.send("got this served"))
  .get('/mt', (req, res) => res.sendFile(__dirname + '/public/metro-timer/metro-timer.html'))
  .get('/times', (req, res) => res.send(showTimes()))
  .use(express.static(__dirname + '/public'))
  .listen(port, () => console.log(`Node.JS with Express listening on port: ${port}`))
;

showTimes = () => {
  let result  = '';
  const times = process.env.TIMES || 5;
  for (i = 0; i < times; i++) {
    result += i + ' ';
  }
  return result;
}