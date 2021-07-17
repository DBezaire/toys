const express = require('express');
const app = express();
const port = 7000;

app.get('/', (req, res) => res.send("got this served"));

app.listen(port, () => console.log(`Express listening on port: ${port}`));

