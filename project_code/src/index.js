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
const path = require('path')


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
app.use(express.static(path.join(__dirname, 'resources')));








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

 const query = `INSERT INTO users (username, password, highscore, currentScore, answers_right, answers_wrong, all_time_score, currency, profile_pic, lives, last_right) VALUES ('${username}', '${hash}', '0', '0', '0', '0', '0', '0', 'img/prof0.png', '3', '0');`;
 // console.log('Username: ', username);
 // console.log('Password: ', hash);
 

 db.none(query)
   .then(()=>{
   res.redirect('/login');
 })
 .catch((error) =>{
  res.render('pages/register.ejs', {message: 'Username already exists', error: true});

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
     res.redirect('/home'); //302
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
  const query = "SELECT username, highscore, profile_pic FROM users ORDER BY highscore desc limit 5;";
  db.any(query) 
  .then(function (data){
    
//    console.log('Username: ' + data.username + ' Password: ' + data.password);
console.log(data);
console.log("Size", data.length);
  res.render("pages/home.ejs",{
   leaders : data,
   size: data.length,
   username: req.session.user.username,
 
   highscore: req.session.user.highscore,
   profile_pic: req.session.user.profile_pic

});
 })
 .catch(function (err) {
   res.render("pages/home.ejs", {message: 'No leaderboard available'});
    
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
   //console.log(results.data); // the results will be displayed on the terminal if the docker containers are running // Send some parameters
   req.session.user.curranswer = results.data[0].correctAnswer;
   if(req.session.user.currentscore > 0 && req.session.user.last_right == 1){
   res.render("pages/trivia.ejs",
   {highscore: req.session.user.highscore,
    currscore: req.session.user.currentscore, 
    lives: req.session.user.lives,
    trivia: results.data, 
    message: `Correct! Nice Job!`});
   }else{
     res.render("pages/trivia.ejs",
   {highscore: req.session.user.highscore, 
    currscore: req.session.user.currentscore,
    lives: req.session.user.lives, 
    trivia: results.data});
  
   }
 })
 .catch(error => {
   // Handle errors
   console.log("ERROR!");
 });
});


app.get('/verifyAnswer', (req,res)=>{
res.redirect('/verifyAnswer');
});

app.get('/change_pic', (req,res)=>{

res.render('pages/change_pic.ejs',{
  profile_pic: req.session.user.profile_pic
});
});

app.post('/change_pic_post', (req,res)=>{
  const query =
  'update users set profile_pic = $1 where username = $2 returning * ;';
// $1 and $2 will be replaced by req.body.name, req.body.username
db.any(query, [req.body.selection, req.session.user.username])
.then(function (data) {
  req.session.user.profile_pic = req.body.selection;
  res.redirect('/profile');

});
});

app.post('/verifyAnswer', (req, res) =>{


console.log("Score", req.session.user.currentscore);
var newScore = req.session.user.currentscore + 10;




//need help getting the asnwer the user selected
//need help getting the correct answer for comparison
console.log("Answer" , req.body);
//console.log("Correct Answer", results.data.correctAnswer);
if(req.body.answer.localeCompare(req.body.correctAnswer) == 0){
 console.log("Correct!!!")
 var right = req.session.user.answers_right + 1;
 var all_time = req.session.user.all_time_score + 10;
 var money = req.session.user.currency + 1; 
 const updateScore =
     'update users set currentscore = $1, answers_right = $2, all_time_score = $3, currency = $4, last_right = $5 where username = $6 returning * ;';
   // $1 and $2 will be replaced by req.body.name, req.body.username
   db.any(updateScore, [newScore, right, all_time, money, '1', req.session.user.username])
   .then(function (data) {
    console.log("asdaskdjnakjask",data)
    req.session.user.currentscore = newScore
    req.session.user.answers_right = right
    req.session.user.all_time_score = all_time
    req.session.user.currency = money
    req.session.user.last_right = '1';

     res.redirect('/play');
   })
   // if query execution fails
   // send error message
   .catch(function (err) {
     return console.log(err);
   });


}else{
 console.log("Incorrect!!!")
 var wrong = req.session.user.answers_wrong + 1;
 var life = req.session.user.lives - 1;

 //check for highscore
 if(life > 0){
  const setlives = 
  `update users set lives = $1, last_right = $2, answers_wrong = $3 where username = $4 returning * ;`;
  db.any(setlives, [life , '0', wrong, req.session.user.username])
   .then(function (data) {
    req.session.user.lives = life;
    req.session.user.last_right = '0';
    req.session.user.answers_wrong = wrong;
    res.redirect('/play');
   })
   .catch(function (err) {
    return console.log(err);
  });

 }else{
 if(req.session.user.currentscore >= req.session.user.highscore){
   const highscore =
     'update users set highscore = $1, answers_wrong = $2 where username = $4 returning * ;';
   // $1 and $2 will be replaced by req.body.name, req.body.username
   db.any(highscore, [req.session.user.currentscore, wrong, '3',  req.session.user.username])
   .then(function (data) {
   // console.log("asdaskdjnakjask",data)
    req.session.user.highscore = req.session.user.currentscore;
    req.session.user.answers_wrong = wrong;
    res.redirect('/gameOver');
   })
   // if query execution fails
   // send error message
   .catch(function (err) {
     return console.log(err);
   });
   //no highscore
 }else{
  const update_wrong =
  'update users set answers_wrong = $1 where username = $2 returning * ;';
  db.any(update_wrong, [ wrong, req.session.user.username])
   .then(function (data) {
    req.session.user.answers_wrong = wrong;
    res.redirect('/gameOver');
   });

   
 }
}
 }






//res.redirect('/play');


});


app.get('/gameOver', (req,res)=>{
  console.log(req.session.user)
  //console.log("Answer", req.session.user.curranswer)
 var reset = 0;
 var tempScore = req.session.user.currentscore;


 const endGame =
     'update users set currentscore = $1, lives = $2 where username = $3 returning * ;';
   // $1 and $2 will be replaced by req.body.name, req.body.username
   db.any(endGame, [reset, '3', req.session.user.username])
   .then(function (data) {
   // console.log("aaa", req.session.user.currAnswer);
    req.session.user.currentscore = reset,
    req.session.user.lives = '3';
    res.render('pages/gameOver', {currscore: tempScore, highscore: req.session.user.highscore, correctanswer: req.session.user.curranswer});
   })
   // if query execution fails
   // send error message
   .catch(function (err) {
     return console.log(err);
   });




})


app.get('/logout', (req,res) =>{
 req.session.destroy();
 res.render('pages/login', {message: `Logged Out Successfully`});


});





app.get('/welcome', (req, res) => {
 res.json({status: 'success', message: 'Welcome!'});
});




app.get('/profile', (req,res) =>{
// correct answers
res.render("pages/profile.ejs", 
{
username: req.session.user.username,
password:req.session.user.password,
highscore:req.session.user.highscore,
answers_right:req.session.user.answers_right,
answers_wrong:req.session.user.answers_wrong,
all_time_score:req.session.user.all_time_score,
currency:req.session.user.currency,
profile_pic: req.session.user.profile_pic


}
);
});

app.get('/rewards', (req,res) =>{
  // correct answers
  res.render("pages/rewards.ejs", 
  {
  username: req.session.user.username,
  password:req.session.user.password,
  highscore:req.session.user.highscore,
  answers_right:req.session.user.answers_right,
  answers_wrong:req.session.user.answers_wrong,
  all_time_score:req.session.user.all_time_score,
  currency:req.session.user.currency
  
  
  }
  );

  });

  app.post('/buyReward', (req, res) => {
    const { username, reward, cost } = req.session.user;

    // SQL to update the reward count and subtract the cost
    const sql = `
        UPDATE users 
        SET ${reward} = ${reward} + 1, currency = currency - ${cost} 
        WHERE username = ${username} AND currency >= ${cost}
    `;

    db.query(sql, [req.session.user.username], (err, result) => {
        if (err) res.status(500).send({ message: 'Error processing request' });
        else if (result.affectedRows === 0) res.status(400).send({ message: 'Not enough currency or invalid user' });
        else res.send({ message: 'Reward purchased successfully' });
    });
});


  

 




// *********************************
// <!-- Section 5 : Start Server-->
// *********************************
// starting the server and keeping the connection open to listen for more requests


module.exports = app.listen(3000);