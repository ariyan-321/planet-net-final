require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const nodemailer = require("nodemailer");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const port = process.env.PORT || 9000;
const app = express();
// middleware
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const sendMail = (emailAddress, emailData) => {
  if (!emailAddress) {
    console.error("No recipient email address provided");
    return;
  }

  if (!emailData?.subject || !emailData?.message) {
    console.error("Email subject or message is missing");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.sendMail(
    {
      from: process.env.EMAIL_USER,
      to: emailAddress,
      subject: emailData.subject,
      html: `<p>${emailData.message}</p>`,
    },
    (err, info) => {
      if (err) {
        console.error("Error sending email:", err.message);
      } else {
        console.log("Email sent:", info.response);
      }
    }
  );
};


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@ariyan.mefyr.mongodb.net/?retryWrites=true&w=majority&appName=Ariyan`;

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
    const db = client.db("planet-net-session");
    const usersCollection = db.collection("users");
    const plantsCollection = db.collection("plants");
    const orderCollection = db.collection("order");

    //  verify admin

    const verifyAdmin = async (req, res, next) => {
      const email = req.user?.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      if (!result || result?.role !== "admin") {
        return res.status(403).send({ message: "UnAuthorized Access" });
      }
      next();
    };

    //  verify admin

    const verifySeller = async (req, res, next) => {
      const email = req.user?.email;
      const query = { email };
      const result = await usersCollection.findOne(query);
      if (!result || result?.role !== "seller") {
        return res.status(403).send({ message: "UnAuthorized Access" });
      }
      next();
    };

    app.get("/plants", async (req, res) => {
      const result = await plantsCollection.find().toArray();
      res.send(result);
    });

    app.get("/all-users/:email", verifyToken, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      const query = { email: { $ne: email } };
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/plants/seller", verifyToken, verifySeller, async (req, res) => {
      const email = req.user?.email;
      const query = { "seller.email": email };
      const result = await plantsCollection.find(query).toArray();
      res.send(result);
    });

    app.delete("/plants/:id", verifyToken, verifySeller, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantsCollection.deleteOne(query);
      res.send(result);
    });

    app.patch(
      "/users/role/:email",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const { role } = req.body;
        const filter = { email };
        const updateDoc = {
          $set: { role, status: "verified" },
        };
        const result = await usersCollection.updateOne(filter, updateDoc);
        res.send(result);
      }
    );

    app.patch("/orders/:id", verifyToken, verifySeller, async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { status },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.patch("/users/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email };
      try {
        const user = await usersCollection.findOne(query);
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        if (user?.status === "requested") {
          return res
            .status(400)
            .send({ message: "You have already requested" });
        }
        const updateDoc = { $set: { status: "requested" } };
        const result = await usersCollection.updateOne(query, updateDoc);
        res.send(result);
      } catch (err) {
        console.error("Error updating user status:", err);
        res.status(500).send({ message: "Internal server error" });
      }
    });

    app.get("/users/role/:email", async (req, res) => {
      const email = req.params.email;
      const result = await usersCollection.findOne({ email });
      res.send({ role: result?.role });
    });

    app.get("/customer-orders/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "customer.Cemail": email };
      const result = await orderCollection
        .aggregate([
          {
            $match: query,
          },
          {
            $addFields: {
              plantId: { $toObjectId: "$plantId" },
            },
          },
          {
            $lookup: {
              from: "plants",
              localField: "plantId",
              foreignField: "_id",
              as: "plants",
            },
          },
          {
            $unwind: "$plants",
          },
          {
            $addFields: {
              name: "$plants.name",
              image: "$plants.image",
              category: "$plants.category",
            },
          },
          {
            $project: {
              plants: 0,
            },
          },
        ])
        .toArray();
      res.send(result);
    });

    app.get(
      "/seller-orders/:email",
      verifyToken,
      verifySeller,
      async (req, res) => {
        const email = req.params.email;
        const query = { seller: email };
        const result = await orderCollection
          .aggregate([
            {
              $match: query,
            },
            {
              $addFields: {
                plantId: { $toObjectId: "$plantId" },
              },
            },
            {
              $lookup: {
                from: "plants",
                localField: "plantId",
                foreignField: "_id",
                as: "plants",
              },
            },
            {
              $unwind: "$plants",
            },
            {
              $addFields: {
                name: "$plants.name",
              },
            },
            {
              $project: {
                plants: 0,
              },
            },
          ])
          .toArray();
        res.send(result);
      }
    );

    app.patch("/plants/quantity/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const { quantityToUpdate, status } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc =
        status === "increase"
          ? { $inc: { quantity: quantityToUpdate } }
          : { $inc: { quantity: -quantityToUpdate } };

      const result = await plantsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.get("/admin-stats",verifyToken,verifyAdmin,async(req,res)=>{
      const totalUsers=await usersCollection.estimatedDocumentCount();
      const totalPlants=await plantsCollection.estimatedDocumentCount();
      // const allOrders=await orderCollection.find().toArray();
      // const totalOrders=allOrders.length;
      // const totalPrice= allOrders.reduce((sum,order)=> sum+parseInt(order.price),0)
      const orderDetails=await orderCollection.aggregate([
        {
          $group:{
            _id:null,
            totalRevenue:{$sum:"$price"},
            totalOrders:{$sum:1}
          }
        },
        {
          $project:{
            _id:0
          }
        }
      ]).next();
      res.send({totalPlants,totalUsers,...orderDetails});
    })

    app.get("/plants/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantsCollection.findOne(query);
      res.send(result);
    });

    app.post("/plants", verifyToken, verifySeller, async (req, res) => {
      const data = req.body;
      const result = await plantsCollection.insertOne(data);
      res.send(result);
    });

    app.post("/order", verifyToken, async (req, res) => {
      const orderInfo = req.body;
      const result = await orderCollection.insertOne(orderInfo);
      if (result.insertedId) {
        sendMail(orderInfo?.customer?.Cemail, {
          subject:"Order Successfully Placed",
          message:`You Have Successfully Placed An Order. Transction Id ${result.insertedId}`
        });
        sendMail(orderInfo?.seller, {
          subject:"You Have An Order to Process",
          message:`Get The Plants Ready For ${orderInfo?.customer?.Cname}`
        });
      }
      res.send(result);
    });

    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const order = await orderCollection.findOne(query);
      if (order.status == "Delivered") {
        return res.status(409).send({ message: "Order Already Delivered" });
      }
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      const isExist = await usersCollection.findOne(query);

      if (isExist) {
        return res.send(isExist);
      }

      const result = await usersCollection.insertOne({
        ...user,
        role: "customer",
        timestamp: Date.now(),
      });
      res.send(result);
    });

    // Generate jwt token
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });
    // Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from plantNet Server..");
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});

