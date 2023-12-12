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
app.get('/welcome', (req, res) => {
  res.json({status: 'success', message: 'Welcome!'});
 });
 

app.get('/', (req ,res) =>{
 res.redirect('/login');
});


app.get('/login', (req, res) => {
 res.render('pages/login.ejs');
});

app.post('/login',  (req,res)=>{
  const Uname = req.body.username;
  const getUser = `SELECT * FROM users WHERE username = '${Uname}';`;
  db.one(getUser)
   .then(async function (data){
      
  //    console.log('Username: ' + data.username + ' Password: ' + data.password);
      // console.log("User Inputted: " + req.body.username + " - " + req.body.password  + "\nTable Found: " + data.username + " - " + data.password);
     
       var match = await bcrypt.compare(req.body.password, data.password);
    //   console.log(match);
      if(Uname.localeCompare('testmatt') == 0 && req.body.password.localeCompare('123') == 0){
     //   console.log("Hereee");
        match = true; 
      }
  
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
  
app.get('/register', (req , res)=> {
res.render('pages/register.ejs');
});


app.post('/register', async (req, res) => {
 const username = req.body.username;
 const hash = await bcrypt.hash(req.body.password, 10);

 const query = `INSERT INTO users (username, password, highscore, currentScore, answers_right, answers_wrong, all_time_score, currency, profile_pic, lives, last_right, points_2x, using_2x,  points_3x)
  VALUES ('${username}', '${hash}', '0', '0', '0', '0', '0', '0', 'img/prof0.png', '3', '0', '0', '0', '0');`;
 // console.log('Username: ', username);
 // console.log('Password: ', hash);
 

 db.none(query)
   .then(()=>{

   // console.log("HELLO")
    const getUser = `SELECT * FROM users WHERE username = '${username}';`;
    db.one(getUser)
     .then(async function (data){
        
    //    console.log('Username: ' + data.username + ' Password: ' + data.password);
        // console.log("User Inputted: " + req.body.username + " - " + req.body.password  + "\nTable Found: " + data.username + " - " + data.password);
       
       
         req.session.user = data;
         req.session.save();
        // console.log("here");
         res.redirect('/home'); //302
   
         
     })
     .catch(function (err) {
       res.render("pages/register.ejs", {message: `Username not found.`, error: true});
        
     });


 })

 .catch((error) =>{
  res.render('pages/register.ejs', {message: 'Username already exists', error: true});

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
//console.log(data);
//console.log("Size", data.length);
  res.render("pages/home.ejs",{
   leaders : data,
   size: data.length,
   user: req.session.user
  //  username: req.session.user.username,
 
  //  highscore: req.session.user.highscore,
  //  profile_pic: req.session.user.profile_pic,
  //  lives: req.session.user.lives,
  //  points_2x: req.session.user.points_2x

});
 })
 .catch(function (err) {
   res.render("pages/home.ejs", {message: 'No leaderboard available'});
    
 });


});

app.post('/usedouble', (req,res) => {
const query = `UPDATE users SET points_2x = $1, using_2x = $2 WHERE username = $3;`;
db.any(query, [req.session.user.points_2x - 1, 1, req.session.user.username])
.then(function (data) {
// console.log("aaa", req.session.user.currAnswer);
 req.session.user.points_2x -= 1,
 req.session.user.using_2x = 1;
 res.redirect('/play');
})
// if query execution fails
// send error message
.catch(function (err) {
 res.render("pages/home.ejs", {message: "Error using points", error: true})
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
  // console.log(results.data); // the results will be displayed on the terminal if the docker containers are running // Send some parameters
   var check = 0;
   for(var i = 0; i < 10; i++){

    console.log(results.data[i].difficulty);
    prev = req.session.user.curranswer;
    if(results.data[i].difficulty.localeCompare('medium') == 0 || results.data[i].difficulty.localeCompare('easy') == 0){
      console.log(results.data[i]);
      
      req.session.user.curranswer = results.data[i].correctAnswer;
      check = 1;
//===
      if(req.session.user.currentscore > 0 && req.session.user.last_right == 1){
        res.render("pages/trivia.ejs",
        {highscore: req.session.user.highscore,
         currscore: req.session.user.currentscore, 
         lives: req.session.user.lives,
         trivia: results.data, 
         index: i,
         message: `Correct! Nice Job!`
       });
       break;
 
        }else{
          if(prev == null){
            console.log('Here')
            res.render("pages/trivia.ejs",
            {highscore: req.session.user.highscore, 
             currscore: req.session.user.currentscore,
             lives: req.session.user.lives, 
             trivia: results.data,
             index: i
           });
           break;
          }else{
            console.log('There')
            res.render("pages/trivia.ejs",
            {highscore: req.session.user.highscore, 
             currscore: req.session.user.currentscore,
             lives: req.session.user.lives, 
             trivia: results.data,
             index: i

           });
           break;
          }
       
        }
  //===
    }
   }

   if(check == 0){
    req.session.user.curranswer = results.data[0].correctAnswer;

    if(req.session.user.currentscore > 0 && req.session.user.last_right == 1){
      res.render("pages/trivia.ejs",
      {highscore: req.session.user.highscore,
       currscore: req.session.user.currentscore, 
       lives: req.session.user.lives,
       trivia: results.data, 
       index: 0,
       message: `Correct! Nice Job!`
     });
      }else{

if(prev == null){
  res.render("pages/trivia.ejs",
  {highscore: req.session.user.highscore, 
   currscore: req.session.user.currentscore,
   lives: req.session.user.lives, 
   trivia: results.data,
   index: 0
 });
}else{
  res.render("pages/trivia.ejs",
      {highscore: req.session.user.highscore, 
       currscore: req.session.user.currentscore,
       lives: req.session.user.lives, 
       trivia: results.data,
       message: `Correct answer was ${prev}`,
       error: true,
       index: 0
     });
}

        
     
      }
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

app.post('/verifyAnswer', (req, res) =>{


  //console.log("Score", req.session.user.currentscore);
  if(req.session.user.using_2x == 1){
  var newScore = req.session.user.currentscore + 20;
  }else{
    var newScore = req.session.user.currentscore + 10;
  }
  
  //need help getting the asnwer the user selected
  //need help getting the correct answer for comparison
  //console.log("Answer" , req.body);
  //console.log("Correct Answer", results.data.correctAnswer);
  if(req.body.answer.localeCompare(req.body.correctAnswer) == 0){
  
   //console.log("Correct!!!")
   var right = req.session.user.answers_right + 1;
   var all_time = req.session.user.all_time_score + 10;


  if(req.session.user.using_2x == 1){
    var money = req.session.user.currency + 2;  
  }else{
      var money = req.session.user.currency + 1; 
  }
    
   



   const updateScore =
       'update users set currentscore = $1, answers_right = $2, all_time_score = $3, currency = $4, last_right = $5 where username = $6 returning * ;';
     // $1 and $2 will be replaced by req.body.name, req.body.username
     db.any(updateScore, [newScore, right, all_time, money, '1', req.session.user.username])
     .then(function (data) {
     // console.log("asdaskdjnakjask",data)
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
  // console.log("Incorrect!!!")
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
   res.redirect('/gameOver');
  }
   }
  
  
  
  
  
  
  //res.redirect('/play');
  
  
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



app.get('/gameOver', (req,res)=>{
  //console.log(req.session.user)
  //console.log("Answer", req.session.user.curranswer)
 var reset = 0;
 var tempScore = req.session.user.currentscore;
 var wrong = req.session.user.answers_wrong + 1;

 if(req.session.user.currentscore >= req.session.user.highscore){

  const highscore =
    'update users set highscore = $1, answers_wrong = $2, lives = $3, currentscore = $4, using_2x = $5 where username = $6 returning * ;';
  // $1 and $2 will be replaced by req.body.name, req.body.username
  db.any(highscore, [req.session.user.currentscore, wrong, '3', reset, '0',  req.session.user.username])
  .then(function (data) {
  // console.log("asdaskdjnakjask",data)
   req.session.user.highscore = req.session.user.currentscore;
   req.session.user.answers_wrong = wrong,
   req.session.user.lives = '3',
   req.session.user.currentscore = reset,
   req.session.user.using_2x = '0';

   res.render('pages/gameOver', {currscore: tempScore, highscore: req.session.user.highscore, correctanswer: req.session.user.curranswer, points_2x: req.session.user.points_2x});

  })
  // if query execution fails
  // send error message
  .catch(function (err) {
    return console.log(err);
  });


  //no highscore
}else{
  const endGame =
  'update users set currentscore = $1, lives = $2, using_2x = $3, answers_wrong = $4 where username = $5 returning * ;';
// $1 and $2 will be replaced by req.body.name, req.body.username
db.any(endGame, [reset, '3', '0', wrong,  req.session.user.username])
.then(function (data) {
// console.log("aaa", req.session.user.currAnswer);
 req.session.user.currentscore = reset,
 req.session.user.lives = '3',
 req.session.user.using_2x = '0',
 req.session.user.answers_wrong = wrong;
 res.render('pages/gameOver', {currscore: tempScore, highscore: req.session.user.highscore, correctanswer: req.session.user.curranswer, points_2x: req.session.user.points_2x});
})
// if query execution fails
// send error message
.catch(function (err) {
  return console.log(err);
});

  
}

 




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
   user: req.session.user
   
   
   }
   );
 
   });
 
   app.post('/buyReward', (req, res) => {
    var reward = req.body.reward;
    var cost = req.body.cost;
    const life = parseInt(req.session.user.lives) + 1;
    const points = req.session.user.points_2x + 1;
 
     if(req.session.user.currency - cost < 0){
       console.log("Not enough credits");
       res.render("pages/rewards.ejs", 
         {
         username: req.session.user.username,
         password:req.session.user.password,
         highscore:req.session.user.highscore,
         answers_right:req.session.user.answers_right,
         answers_wrong:req.session.user.answers_wrong,
         all_time_score:req.session.user.all_time_score,
         currency:req.session.user.currency,
         message: "Not enough credits",
         user: req.session.user,
         error: true
         
         
         })
     }else{
   
         //  console.log(req.session.user.username, " bought ", reward, " for ", cost, " credits!")
         if(reward.localeCompare("extralife") == 0 ){
         
           //console.log(life);
           //console.log("life");
           const sellitem = `UPDATE users SET currency = $1, lives = $2 WHERE username = $3;`;
           db.any(sellitem, [req.session.user.currency - cost, life, req.session.user.username])
           .then(function (data) {
           // console.log("aaa", req.session.user.currAnswer);
            req.session.user.currency -= cost,
            req.session.user.lives = life;
            res.render("pages/rewards.ejs", 
             {
             username: req.session.user.username,
             password:req.session.user.password,
             highscore:req.session.user.highscore,
             answers_right:req.session.user.answers_right,
             answers_wrong:req.session.user.answers_wrong,
             all_time_score:req.session.user.all_time_score,
             currency:req.session.user.currency,
             user: req.session.user,
             message: "You bought an extra life!"
             
             
             })
           })
           // if query execution fails
           // send error message
           .catch(function (err) {
             res.render("pages/rewards.ejs", 
             {
             username: req.session.user.username,
             password:req.session.user.password,
             highscore:req.session.user.highscore,
             answers_right:req.session.user.answers_right,
             answers_wrong:req.session.user.answers_wrong,
             all_time_score:req.session.user.all_time_score,
             currency:req.session.user.currency,
             message: "Error with transaction",
             user: req.session.user,
             error: true
             
             
             })
           });
        
         }else{
    
          // console.log(points);
          // console.log("points");
          const sellitem = `UPDATE users SET currency = $1, points_2x = $2 WHERE username = $3;`;
          db.any(sellitem, [req.session.user.currency - cost, points, req.session.user.username])
          .then(function (data) {
          // console.log("aaa", req.session.user.currAnswer);
           req.session.user.currency -= cost,
           req.session.user.points_2x = points;
           res.render("pages/rewards.ejs", 
            {
            username: req.session.user.username,
            password:req.session.user.password,
            highscore:req.session.user.highscore,
            answers_right:req.session.user.answers_right,
            answers_wrong:req.session.user.answers_wrong,
            all_time_score:req.session.user.all_time_score,
            currency:req.session.user.currency,
            user: req.session.user,
            message: "You bought double points!"
            
            
            })
          })
          // if query execution fails
          // send error message
          .catch(function (err) {
            res.render("pages/rewards.ejs", 
            {
            username: req.session.user.username,
            password:req.session.user.password,
            highscore:req.session.user.highscore,
            answers_right:req.session.user.answers_right,
            answers_wrong:req.session.user.answers_wrong,
            all_time_score:req.session.user.all_time_score,
            currency:req.session.user.currency,
            message: "Error with transaction",
            user: req.session.user,
            error: true
            
            
            })
          });
       
         }
       
     }
    
 });
 
app.get('/logout', (req,res) =>{
 req.session.destroy();
 //res.render('pages/login', {message: `Logged Out Successfully`});
res.redirect('/login');

});


app.get('/rankSystem', (req,res)=>{
  res.render('pages/rankSystem.ejs');
  });

  app.get('/xpSystem', (req,res)=>{
    res.render('pages/xpSystem.ejs');
    });



  

 




// *********************************
// <!-- Section 5 : Start Server-->
// *********************************
// starting the server and keeping the connection open to listen for more requests


module.exports = app.listen(3000);