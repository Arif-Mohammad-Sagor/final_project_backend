const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const port = process.env.PORT || 4000;
const cors = require("cors");

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
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT_ACCESS_TOKEN, (error, user) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.user = user;
    next();
  });
};

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

    const instructorsCollection = client
      .db("Languages")
      .collection("Instructors");
    const classesCollection = client.db("Languages").collection("Classes");
    const selectedClassesCollection = client
      .db("Languages")
      .collection("selectedClasses");
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

    // get all classes added by instrcutor
    app.get("/myAllClasses", async (req, res) => {
      const result = await classesCollection.find(req.query).toArray();
      res.send(result);
    });
    app.post("/newClasses", async (req, res) => {
      const newItem = req.body;
      // console.log(newItem);
      const result = await classesCollection.insertOne(newItem);
      // console.log(newItem, result);
      res.send(result);
    });
/// admin actin for approve or denail
    app.patch("/updateMyClass/:id", async (req, res) => {
      const id = req.params.id;
      const queryId = { _id: new ObjectId(id) };
      const newStatus = "approved";

      try {
        const updatedClass = await classesCollection.updateOne(queryId, {
          $set: { status: newStatus },
        });

        if (updatedClass.modifiedCount === 0) {
          return res.status(404).json({ error: "Class not found" });
        }

        return res.json(updatedClass);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    // update dinail
     app.patch("/updateMyClassDenial/:id", async (req, res) => {
       const id = req.params.id;
       const queryId = { _id: new ObjectId(id) };
       const newStatus = "denied";

       try {
         const updatedClass = await classesCollection.updateOne(queryId, {
           $set: { status: newStatus },
         });

         if (updatedClass.modifiedCount === 0) {
           return res.status(404).json({ error: "Class not found" });
         }

         return res.json(updatedClass);
       } catch (error) {
         console.error(error);
         return res.status(500).json({ error: "Internal server error" });
       }
     });
/// admin feedback section here
    app.patch("/updateMyInstructorClass/:id", async (req, res) => {
    const id = req.params.id;
    const feedbackContent = req.body;
      const queryId = { _id: new ObjectId(id) };
      // console.log(feedbackContent);

    try {
      const updatedClass = await classesCollection.updateOne(queryId, {
        $set: { feedback: feedbackContent },
      });

      if (updatedClass.modifiedCount === 0) {
        return res.status(404).json({ error: "Class not found" });
      }

      return res.json(updatedClass);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
    }

});


    // selected classes apis here
    app.get("/selectedClasses", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { Email: email };
      const result = await selectedClassesCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/selectedClass", async (req, res) => {
      const course = req.body;
      // console.log(courseName);
      const query = { Name: course.Name };
      const Existing = await selectedClassesCollection.findOne(query);
      // console.log(Existing);
      if (Existing) {
        return res.send({ message: "Already you have added to cart" });
      }
      const result = await selectedClassesCollection.insertOne(course);
      res.send(result);
    });
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
      const amount = price;

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

    // user history api here

    app.get("/myEnrolledClasses", async (req, res) => {
      const pipeline = [
        {
          $lookup: {
            from: "Classes",
            localField: "haveInAllClassItemsId",
            foreignField: "_id",
            as: "matchingClasses",
          },
        },
      ];

      const result = await paymentsCollection.aggregate(pipeline).toArray();
      // console.log(result);
      const matchingClasses = result[0].matchingClasses;

      // Return the matching classes
      // console.log(matchingClasses);
      res.send({ classes: matchingClasses });
    });

    // user payment apis here
    app.post("/makepayment", async (req, res) => {
      const payment = req.body;
      paymentsCollection;
      // here converting into new object id ;
      payment.haveInAllClassItemsId = payment.haveInAllClassItemsId.map(
        (item) => new ObjectId(item)
      );
      const result = await paymentsCollection.insertOne(payment);
      // console.log(result);
      // here converting into new object Id selected id for delete option.
      const query = {
        _id: {
          $in: payment.selectedClassItemsId.map((id) => new ObjectId(id)),
        },
      };
      const deletedSelectedClasses = await selectedClassesCollection.deleteMany(
        query
      );

   try {
  // Aggregation pipeline to update studentQty and AvailableSeats for matching classes
  const pipeline = [
    {
      $match: {
        _id: { $in: payment.haveInAllClassItemsId },
      },
    },
    {
      $project: {
        _id: 1,
        Name: 1,
        Price: 1,
        Image: 1,
        studentQty: { $add: ["$studentQty", 1] },
        InstructorName: 1,
        AvailableSeats: { $subtract: ["$AvailableSeats", 1] },
      },
    },
    {
      $merge: {
        into: "Classes",
        on: "_id",
        whenMatched: "replace",
      },
    },
  ];

  // Perform the aggregation to update studentQty and AvailableSeats
  await classesCollection.aggregate(pipeline).toArray();

  // Respond with success message
  res.status(200).send({
    result,
    deletedSelectedClasses,
    message: "Payment successful. Class quantity updated.",
  });
} catch (err) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}

      // second pipeline


    });

    app.get("/mypaymentHistory", async (req, res) => {
      const email = req.query.email;
      // console.log(email);
      const query = { email: email };
      const paymentHistory = await paymentsCollection
        .find(query)
        .project({
          email: 1,
          transectionId: 1,
          quantity: 1,
          selectedClassItemsNames: 1,
          price: 1,
          date: 1,
        })
        .sort({ date: -1 })
        .toArray();

      // console.log("paymenthistory", paymentHistory)
      // res.send({paymentHistory})
      res.send(paymentHistory);
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

app.get("/", (req, res) => {
  res.send(" hello World How are you ?");
});
app.listen(port, () => {
  console.log(` my port is running on port: ${port}`);
});
