CREATE TABLE users(
    --basic data information from user
username varchar(50) PRIMARY KEY,--Primary key to user
password char(60) NOT NULL, --password
highscore int,
currentscore int,
curranswer CHAR(60),
profile_pic char(60),
lives int,
last_right int,
--answers / currency
answers_right int,
answers_wrong int, 
all_time_score int,
currency int,
  --power ups / rewards
points_2x int,
Revive int,
points_3x int,
bomb int,
bomb_2x int
);

