Brief Application description
 Our trivia game, Think Tank Trivia, will provide users with a fun 
and engaging game that challenges random knowlege of users! Users 
will be able to register for their own account, upon logging in 
they will be greeted with a homepage that displays the option to
play a new game, view history of previously played games, and 
shows the user's unique highscore.
    If the user wants to play a game, they may have the option to 
select a genre (History, Art, Computer Science, Sports, etc...)
(this will be an added functionality) and will then be prompted with
a trivia question and 4 buttons, with one button containing the 
correct answer. If the user selects the correct answer, their score
will increase, if not, the game will end and display the score. If
the score exceeds the user's highscore, it will update in the database
and redirect to the homepage. 
    If the user wants to view a history of played games, they can
see a list of users who answered x number of questions with a score
of x. We may order this to make a 'leaderboard' based on highscore.
We will build this with basic implementations, and using our agile
planning strategy, will make changes and add functionality as we see fit. 




Contributors - In this case, it will be the team Members
Keaton
Built API’s such as ‘/play’ which includes an axios call to the Trivia API
Built ‘/verifyAnswer’ that runs the ‘behind the scenes’ of the game: verifying the answer and rewarding or punishing the user depending on the circumstances. 
Built trivia.ejs which connects the user to these API’s through a UI.
Worked in every field front end, back end, etc.  


Quincy 
Worked on login page
Worked on home page
Worked on register page
Fixed errors when needed 
Came up with color theme ideas
Came up with button layout ideas
Tried to come up with currency deletion 
Helped with project deployment
Worked on deliverables 
Maintained project board updates 

Joao
Created all test cases
Worked on login page 
Worked on register page
Worked completely on the rewards tab
Worked on the home page css
Created sql and data base
Creation of currency
Creation of different rewards of game
Creation of timeset in the game
Worked on the index.js 
Css of the home page
Css of the rewards tab
Helped with multiple api
Css for rewards tab

Alex
Built entirety of profile page
Made APIs such as /xpSystem and /rankSystem
Created Rank system
Added pictures for background and rank pictures
UAT Test Plan
Updated all release notes when it came time
Helped with CSS and styling
Created the Cloud to host application 
Helped Joao with the test cases



Technology Stack used for the project
HTML, CSS, EJS, PostgreSQL, Axios, Github, Discord, Google Drive

Prerequisites to run the application - Any software that needs to be installed to run the application
Docker 

Instructions on how to run the application locally.
Navigate to /CSCI3308GroupProject/project_code/src
Run 'docker compose up'
Wait to establish a database connection
Go to 'https://localhost:3000'
Enjoy our game! 

How to run the tests
Our tests can be found in /CSCI3308GroupProject/project_code/src/test/server.spec.js
When you run 'docker compose up' our docker-compose.yaml file calss for the test cases automatically.
You should expect to see '5 passing' in the terminal followed by a database connection
If this is not the case, comment out server.spec.js and run docker compose up without the tests. 


Link to the deployed application
