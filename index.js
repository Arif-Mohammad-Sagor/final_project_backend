const express = require('express');
const app = express();
const port = process.env.PORT || 4000;
const cors = require('cors')

// middlewares
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
   res.send(' hello World How are you ?')
})
app.listen(port, () => {
   console.log(` my port is running on port: ${port}`)
})