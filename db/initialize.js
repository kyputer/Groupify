/**
 * Create the database necessary for the project if it does not exist
 * This will automatically run when you include `require('./db');`.
 */
require('dotenv').config();
var mysql = require('mysql');
var c = mysql.createConnection({
  host     : '127.0.0.1',
  user     : process.env.USERNAME,
  password : process.env.PASSWORD
});
c.connect();

c.query('CREATE DATABASE IF NOT EXISTS groupify;');

c.query('USE groupify;');

c.query('CREATE TABLE IF NOT EXISTS user (' +
         '  UserID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
         '  Username VARCHAR(100) NOT NULL,' +
         '  Password VARCHAR(100) NOT NULL );');

c.query('CREATE TABLE IF NOT EXISTS track (' +
        '  TrackID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
        '  SpotifyID VARCHAR(22) NOT NULL,' +
        '  Votes INT NOT NULL,' +
        '  Blacklist INT );');

c.query('CREATE TABLE IF NOT EXISTS vote (' +
        '  VoteID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
        '  TrackID VARCHAR(22) NOT NULL,' +
        '  UserID INT NOT NULL,' +
        '  Play BOOLEAN NOT NULL );');

c.query('UPDATE track SET Blacklist=NULL;'); // Reset blacklist

c.end();
