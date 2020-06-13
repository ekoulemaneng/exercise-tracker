// Require Express et set an instance
const express = require('express');
const app = express();
//--------

// Static files
app.use(express.static('public'));
//--------

// Module to parse sent form data 
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));
//--------

// Module to allow others domains to communicate with this server
const cors = require('cors');
app.use(cors());
//--------

// Require Mongoose and connect to remote database server
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE, {useNewUrlParser: true, useUnifiedTopology: true});
//--------

// Get notification if connection is successfull or if a connection error occurs
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', () => console.log("We're connected!")); 
//--------

// Set database schema and model
// 1- Set the schema
const userSchema = new mongoose.Schema({
  'username': String,
  'log': [{
    'description': String,
    'duration': Number,
    'date': String
  }]
});
// 2- Compile schema into model
const User = mongoose.model('User', userSchema);
//--------

// Set routes

app.get('/', (req, res) => res.send("/public/index.html"));

app.post('/api/exercise/new-user', (req, res) => {
  let username = req.body.username;
  let user = new User({'username': username, 'log': []});
  user.save((err, newUser) => {
    if (err) res.send('Username already taken');
    res.json({"_id": newUser['_id'], "username": newUser['username']});
  });
});

app.post('/api/exercise/add', (req, res) => {
  let userId = req.body.userId;
  let description = req.body.description;
  let duration = req.body.duration;
  let date = req.body.date ? (new Date(req.body.date)).toDateString() : (new Date()).toDateString();
  User.findById(userId, (err, user) => {
    if (err) res.send('No user is registered with this userId in the database');
    else {
      user['log'].push({"description": description, "duration": duration, "date": date});
      user.save((err, user) => res.json({"userId": user['_id'], "username": user['username'], "description": description, "duration": parseInt(duration), "date": date}));}
  })
});

app.get('/api/exercise/log', (req, res) => {
  let userId = req.query.userId;
  let from = req.query.from ? req.query.from : -8640000000000000;
  let to = req.query.to ? req.query.to : 8640000000000000;
  let limit = parseInt(req.query.limit);
  User.findById(userId, (err, user) => {
    if (err) res.send('No user is registered with this userId in the database');
    else {
      let log = user['log'].filter(obj => ((new Date(obj['date'])) >= (new Date(from))) && ((new Date(obj['date'])) <= (new Date(to))));
      if (limit < log.length) log = log.slice(0, limit);
      res.json({"userId": user['_id'], "username": user['username'], "count": log.length, "log": log});
    }
  })
});

app.get('/api/exercise/users', (req, res) => {
  User.find({}, 'username',(err, users) => {
    if (err) res.send('There are no user');
    res.json(users);
  });
});

app.use((err, req, res, next) => res.status(500).send('Something broke!'));

app.use((req, res, next) => res.status(404).send('Sorry cant find that!'));

app.listen(3000);



