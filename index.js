const express = require('express');
const app = express();
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const cors = require('cors')


// middlewares
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (error, user) => {
    if (error) {
        return res
          .status(401)
          .send({ error: true, message: "unauthorized access" });
    }
    req.user = user;
    next();
  })
}

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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

    const instructorsCollection = client.db("Languages").collection("Instructors");
    const classesCollection = client.db("Languages").collection("Classes");
    const selectedClassesCollection = client.db("Languages").collection("selectedClasses");

    app.post("/jwt", (req, res) => {
      const userInfo = req.body;
      const token = jwt.sign(userInfo, process.env.JWT_ACCESS_TOKEN, {
        expiresIn: "1hr",
      });
      res.send({ token });
    });
    // instructors  related apis
    app.get("/instructors", async (req, res) => {
      const result = await instructorsCollection.find().toArray();
      res.send(result);
    });
    // classes relate apis
    app.get("/classes", async (req, res) => {
      const result = await classesCollection.find().toArray();
      res.send(result);
    });
    app.get("/selectedClasses",verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { Email:email }
      const result = await selectedClassesCollection.find(query).toArray();
      res.send(result);
    });
    app.post('/selectedClass', async (req, res) => {
      const mySelectedClass = req.body;
      // console.log('form selectedClass',mySelectedClass);
      const result = await selectedClassesCollection.insertOne(mySelectedClass);
      res.send(result);
    })
    app.delete("/selectedClasses/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedClassesCollection.deleteOne(query);
      res.send(result);
   });
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