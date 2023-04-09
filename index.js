
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const port=process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app=express();
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aoyn8.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run(){
    try{
        const studentCollection=client.db('college').collection('registration');

        app.post('/registration',async(req,res)=>{
            try{
              const studentInfo = req.body;
              const hashPass = await bcrypt.hash(req.body.password, 10);
              studentInfo.password = hashPass;
              const result=await studentCollection.insertOne(studentInfo)
              res.send(result);
            }
            catch(err){
              throw err;
            }
        });

        app.post('/login',async(req,res)=>{
            try{
              const email = req.body.email;
              const password = req.body.password;
              const user=await studentCollection.findOne({email:email})
              if (!user) {
                  res.status(401).send('Invalid email or password');
                } 
                else {
                  bcrypt.compare(password, user.password, function(err, result) {
                    if (err) throw err;
          
                    if (result === true) {
                      const token = jwt.sign({data: {email: user.email, id: user._id}}, process.env.JWT_KEY, {expiresIn: '12h'});
                      res.send({token});
                    } else {
                      res.status(401).send('Invalid email or password');
                    }
                  });
              }
            }
            catch(err){
              throw err;
            }
        });
        app.get('/student-info', async(req, res)=>{
          try{
            const token = req.headers.authorization;
            const data = jwt.verify(token, process.env.JWT_KEY);
            if(data.data.email){
              const user=await studentCollection.findOne({email:data.data.email})
              res.send(user);
            }
            res.send({message: "Data not found"});
          }
          catch(err){
            //throw err;
          }
        })
       

    }
    finally{
       
       
    }

 

}
run().catch(console.log);





app.get('/',async(req,res)=>{
    res.send("college server running.");
});

app.listen(port,()=>console.log(`college server running on ${port}`))