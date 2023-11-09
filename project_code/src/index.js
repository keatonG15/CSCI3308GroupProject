// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.
const bcrypt = require('bcrypt'); //  To hash passwords
const axios = require('axios'); // To make HTTP requests from our server. We'll learn more about it in Part B.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// database configuration
const dbConfig = {
  host: 'db', // the database server
  port: 5432, // the database port
  database: process.env.POSTGRES_DB, // the database name
  user: process.env.POSTGRES_USER, // the user account to connect with
  password: process.env.POSTGRES_PASSWORD, // the password of the user account
};

const db = pgp(dbConfig);

// test your database
db.connect()
  .then(obj => {
    console.log('Database connection successful'); // you can view this message in the docker compose logs
    obj.done(); // success, release the connection;
  })
  .catch(error => {
    console.log('ERROR:', error.message || error);
  });

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

app.set('view engine', 'ejs'); // set the view engine to EJS
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
// <!-- Endpoint 1 :  Default endpoint ("/") -->
// *****************************************************
// <!-- Section 4: API Calls -->
// *****************************************************

app.get('/', (req ,res) =>{
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('pages/login.ejs');
});

app.get('/register', (req , res)=> {
res.render('pages/register.ejs');
});

app.post('/register', async (req, res) => {
const username = req.body.username;
const hash = await bcrypt.hash(req.body.password, 10);
const query = `INSERT INTO users (username, password, highscore, currentScore) VALUES ('${username}', '${hash}', '0', '0');`;
// console.log('Username: ', username);
// console.log('Password: ', hash);

db.none(query)
.then(()=>{
res.redirect('/login');
})
.catch((error) =>{
res.redirect('/register');

});

});

app.post('/login',  (req,res)=>{
const Uname = req.body.username;
const getUser = `SELECT * FROM users WHERE username = '${Uname}';`;
db.one(getUser)
  .then(async function (data){
      
//    console.log('Username: ' + data.username + ' Password: ' + data.password);
      console.log("User Inputted: " + req.body.username + " - " + req.body.password  + "\nTable Found: " + data.username + " - " + data.password);
     
      const match = await bcrypt.compare(req.body.password, data.password);

    //  console.log("Match: " + match);
      if(match){
      req.session.user = data;
      req.session.save();
     // console.log("here");
      res.redirect('/home');
      }else{
        res.render("pages/login.ejs", {message: `Invalid username or password`, error: true});
      }
  })
  .catch(function (err) {
    res.render("pages/register.ejs", {message: `Username not found.`, error: true});
      
  });
});




const auth = (req, res, next) => {
  if (!req.session.user) {
    // Default to login page.
    return res.redirect('/login');
  }
  next();
};
app.use(auth);

app.get('/home', (req, res) => {
  console.log(req.session.user);
res.render("pages/home.ejs",{
  username: req.session.user.username,
  password: req.session.user.password,
  highscore: req.session.user.highscore,
  currscore: req.session.user.currentscore,
});


});

app.get('/play', (req,res) => {
  

axios({
  url: `https://the-trivia-api.com/v2/questions`,
  method: 'GET',
  dataType: 'json',
  headers: {
    'Accept-Encoding': 'application/json',
  },
  // params: {
  //   apikey: process.env.API_KEY,
  //   keyword: 'Zac Brown', //you can choose any artist/event here
  //   size: 10 // you can choose the number of events you would like to return
  // },
})
  .then(results => {
   // var score = 0;
    console.log(results.data); // the results will be displayed on the terminal if the docker containers are running // Send some parameters
    res.render("pages/trivia.ejs", 
    {highscore: req.session.user.highscore, currscore: req.session.user.currentscore, trivia: results.data});
  })
  .catch(error => {
    // Handle errors
    console.log("ERROR!");
  });
});

// app.get('/verifyAnswer', (req,res)=>{
// res.redirect('/verifyAnswer');
// });

app.post('/verifyAnswer', (req, res) =>{

console.log("Score", req.session.user.currentscore);
console.log("Answer" , req.body.name);



//res.redirect('/play');
});

app.get('/logout', (req,res) =>{
  req.session.destroy();
  res.render('pages/login', {message: `Logged Out Successfully`});

});


// *********************************
// <!-- Section 5 : Start Server-->
// *********************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000, () => {
  console.log('listening on port 3000');
});