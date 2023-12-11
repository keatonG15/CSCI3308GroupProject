CREATE TABLE users(
    --basic data information from user
username varchar(50) PRIMARY KEY,--Primary key to user
password char(60) NOT NULL, --password
highscore int DEFAULT 0,
currentscore int DEFAULT 0,
curranswer CHAR(60),
profile_pic char(60),
lives int DEFAULT 3,
last_right int DEFAULT 0,
--answers / currency
answers_right int DEFAULT 0,
answers_wrong int DEFAULT 0, 
all_time_score int DEFAULT 0,
currency int DEFAULT 0,
  --power ups / rewards
points_2x int DEFAULT 0,
using_2x int DEFAULT 0,
points_3x int DEFAULT 0

);

INSERT INTO users (username, password, highscore, currentScore, answers_right, answers_wrong, all_time_score, currency, profile_pic, lives, last_right, points_2x, using_2x,  points_3x)
VALUES ('testmatt', '123', '0', '0', '0', '0', '0', '0', 'img/prof0.png', '3', '0', '0', '0', '0') returning *;


