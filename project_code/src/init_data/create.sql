CREATE TABLE users(
username varchar(50) PRIMARY KEY,--Primary key to user
password char(60) NOT NULL, --password
highscore int,
currentscore int,
curranswer CHAR(60),

answers_right int,
answers_wrong int, 
all_time_score int,
currency int

);
