const express = require('express');
const app = express();
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const cors = require('cors')


// middlewares
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri =
  `mongodb+srv://mdSagor:WpCXE6hxYmlQlcZz@cluster0.gmwr7s9.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
     await client.connect();

     app.post('/jwt', (req, res) => {
        const userInfo = req.body;
        const token = jwt.sign(userInfo, process.env.JWT_ACCESS_TOKEN, {
           expiresIn:'1hr'
        });
        res.send({token})
     })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
   //  await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
   res.send(' hello World How are you ?')
})
app.listen(port, () => {
   console.log(` my port is running on port: ${port}`)
})