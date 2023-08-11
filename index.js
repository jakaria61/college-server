
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aoyn8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
  try {
    const studentCollection = client.db('college').collection('registration');
    const DepartmentCollection = client.db('college').collection('addDepartment');
    const adminCollection = client.db('college').collection('admin');
    const teacherCollection = client.db('college').collection('teacher');
    const paymentCollection = client.db('college').collection('payment');
    const paymentsCollection = client.db('college').collection('payments');

    // all student 
    app.get('/all-student', async (req, res) => {
      try {

        const result = await studentCollection.find({}).toArray()
        console.log(result);
        res.json(result)
      }
      catch (err) {
        //throw err;
      }
    });
    //all dept
    app.get('/all-dept', async (req, res) => {
      try {

        const result = await DepartmentCollection.find({}).toArray()
        console.log(result);
        res.json(result)
      }
      catch (err) {
        //throw err;
      }
    });
    // all teacher
    app.get('/all-teacher', async (req, res) => {
      try {

        const result = await teacherCollection.find({}).toArray()
        console.log(result);
        res.json(result)
      }
      catch (err) {
        //throw err;
      }
    });
    //who pay 
    app.get('/all-payments', async (req, res) => {
      try {

        const result = await paymentsCollection.find({}).toArray()
        console.log(result);
        res.json(result)
      }
      catch (err) {
        throw err;
      }
    });
    // insert data into paymet
    app.post('/payment', async (req, res) => {
      try {

        const result = await paymentCollection.insertOne(req.body)
        res.send(result);
      }
      catch (err) {
        throw err;
      }
    });
    //student reg
    app.post('/registration', async (req, res) => {
      try {
        const studentInfo = req.body;
        const hashPass = await bcrypt.hash(req.body.password, 10);
        studentInfo.password = hashPass;
        const result = await studentCollection.insertOne(studentInfo)
        res.send(result);
      }
      catch (err) {
        throw err;
      }
    });
    // student login
    app.post('/login', async (req, res) => {
      try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await studentCollection.findOne({ email: email })
        if (!user) {

          res.send({ message: 'User Not Found' });
        }
        else {

          bcrypt.compare(password, user.password, function (err, result) {
            console.log(result)
            if (result === true) {
              const token = jwt.sign({ data: { email: user.email, id: user._id } }, process.env.JWT_KEY, { expiresIn: '12h' });
              res.send({ token });
            } else {
              res.send({ message: "Mis Match Email or Password", token: false });
            }
          });
        }
      }
      catch (err) {
        throw err;
      }
    });
    //student details
    app.get('/student-info', async (req, res) => {
      try {
        const token = req.headers.authorization;
        const data = jwt.verify(token, process.env.JWT_KEY);
        if (data.data.email) {
          const user = await studentCollection.findOne({ email: data.data.email })
          res.send(user);
        }
        res.send({ message: "Data not found" });
      }
      catch (err) {
        //throw err;
      }
    });


    //add department
    app.post('/addDepartment', (req, res) => {
      const newDepartment = req.body;
      DepartmentCollection.insertOne(newDepartment)
        .then(result => console.log(result.insertedCount))
      res.send(result.insertedCount > 0)
    });
    // add admin
    app.post('/addAdmin', (req, res) => {
      const newService = req.body;
      adminCollection.insertOne(newService)
        .then(result => console.log(result.insertedCount))
      res.send(result.insertedCount > 0)
    });
    // add teacher
    app.post('/addTeacher', (req, res) => {
      const newTeacher = req.body;
      teacherCollection.insertOne(newTeacher)
        .then(result => console.log(result.insertedCount))
      res.send(result.insertedCount > 0)

    });
    //delete student
    app.delete('/all-student/:id', async (req, res) => {
      const id = req.params.id;
      console.log("please delete id :", id);
      const query = { _id: new ObjectId(id) };
      const result = await studentCollection.deleteOne(query);
      res.send(result);
    })

    app.post('/admin', async (req, res) => {
      try {
        const addAdminInfo = req.body;
        const hashPass = await bcrypt.hash(req.body.password, 10);
        addAdminInfo.password = hashPass;
        const result = await adminCollection.insertOne(addAdminInfo)
        res.send(result);
      }
      catch (err) {
        throw err;
      }
    });
    // admin login
    app.post('/adminLogin', async (req, res) => {
      try {
        const email = req.body.email;
        const password = req.body.password;
        const user = await adminCollection.findOne({ email: email })
        if (!user) {

          res.send({ message: 'User Not Found' });
        }
        else {

          bcrypt.compare(password, user.password, function (err, result) {
            console.log(result)
            if (result === true) {
              const token = jwt.sign({ data: { email: user.email, id: user._id } }, process.env.JWT_KEY, { expiresIn: '12h' });
              res.send({ token });
            } else {
              res.send({ message: "Mis Match Email or Password", token: false });
            }
          });
        }
      }
      catch (err) {
        throw err;
      }
    });
    // getting tution fee
    app.get('/balance/:id', async (req, res) => {

      try {

        const result = await paymentCollection.findOne({ StudentId: req.params.id })
        res.json(result);
      }
      catch (err) {
        //throw err;
      }
    });

    //payment tution fee
    app.get('/payment/:id', async (req, res) => {
      try {

        const payment = await paymentCollection.findOne({ StudentId: req.params.id });
        res.send(payment);

      }
      catch (err) {
        throw err;
      }
    });

    // card paymet gateway
    app.post('/create-payment-intent', async (req, res) => {
      const payment = req.body;
      const tutionFee = payment.tutionFee;
      const amount = tutionFee * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        "payment_method_types": [
          "card"
        ]
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    //store payment in database
    app.post('/payments', (req, res) => {
      const pay = req.body;
      paymentsCollection.insertOne(pay)
        .then(result => console.log(result.insertedCount))
      res.send(result.insertedCount > 0)
    });


  }
  finally {


  }

}
run().catch(console.log);


app.get('/', async (req, res) => {
  res.send("college server running.");
});

app.listen(port, () => console.log(`college server running on ${port}`))