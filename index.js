const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.piukg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const serviceCollection = client.db("doctor_portal").collection("services");
    const bookingCollection = client.db("doctor_portal").collection("bookings");
    app.get('/service',async(req,res)=>{
        const query={};
        const cursor=serviceCollection.find(query);
        const services =await cursor.toArray();
        res.send(services)
    })
    app.get('/available',async(req,res)=>{
      const date =req.query.date || 'May 22, 2022';
      const services= await serviceCollection.find().toArray();
      const query={date:date};
      const bookings=await bookingCollection.find(query).toArray();
      services.forEach(service=>{
        const serviceBookings=bookings.filter(b=>b.treatment===service.name);
        const booked=serviceBookings.map(s=>s.slot);
        const available=service.slots.filter(s=>!booked.includes(s))
        service.slots=available;
      })
      res.send(services);
    })
    app.post('/booking',async(req,res)=>{
        const booking=req.body;
        const query={treatment:booking.treatment,date:booking.date,patient:booking.patient}
        const exists = await bookingCollection.findOne(query);
        if(exists){
            return res.send({success:false,booking:exists})
        }
        const result = await bookingCollection.insertOne(booking);
        res.send({success:true,result})

    })
app.get('/booking',async(req,res)=>{
  const patient =req.query.patient;
  const query={patient:patient};
  const bookings=await bookingCollection.find(query).toArray();
  res.send(bookings)
})


  } finally {
  }
}
run().catch(console.dir);

// perform actions on the collection object
client.close();

app.get("/", (req, res) => {
  res.send("Doctor Sever");
});
app.listen(port, () => {
  console.log(`Doctor app listening on port ${port}`);
});
