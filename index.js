const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
   res.send(' hello world')
})
app.listen(port, () => {
   console.log(` my port is running on port: ${port}`)
})