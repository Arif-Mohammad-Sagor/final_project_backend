const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const cors = require('cors')

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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


const uri = `mongodb://mdSagor:WpCXE6hxYmlQlcZz@ac-voaoh7g-shard-00-00.gmwr7s9.mongodb.net:27017,ac-voaoh7g-shard-00-01.gmwr7s9.mongodb.net:27017,ac-voaoh7g-shard-00-02.gmwr7s9.mongodb.net:27017/?ssl=true&replicaSet=atlas-xr8fvm-shard-0&authSource=admin&retryWrites=true&w=majority`;
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
    const paymentsCollection = client.db("Languages").collection("payments");

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
    // selected classes apis here
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
// payment related apis here //
// Todo :have to verify user here
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = price

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: parseInt(amount * 100),
        currency: "INR",
        description: "software compary",
        shipping: {
          name: "LalSign",
          address: {
            line1: "510 Townsend St",
            postal_code: "98140",
            city: "Sahinbag Delhi",
            state: "New Delhi",
            country: "India",
          },
        },
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // user payment apis here
    app.post('/makepayment', async (req, res) => {
      const payment = req.body;
      // here converting into new object id ;
          payment.haveInAllClassItemsId = payment.haveInAllClassItemsId.map(
            (item) => new ObjectId(item)
          );
          const result = await paymentsCollection.insertOne(payment);
    // here converting into new object Id selected id
          const query = {
            _id: {
              $in: payment.selectedClassItemsId.map((id) => new ObjectId(id)),
            },
          };
      const deletedSelectedClasses = await selectedClassesCollection.deleteMany(query);
          
          res.status(200).send({
            result,
            deletedSelectedClasses,
          });
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