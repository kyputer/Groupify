// /**
//  * Create the database necessary for the project if it does not exist
//  * This will automatically run when you include `require('./db');`.
//  */
// // require('dotenv').config();
// // var mysql = require('mysql');
// // var c = mysql.createConnection({
// //   host     : '127.0.0.1',
// //   user     : process.env.USERNAME,
// //   password : process.env.PASSWORD
// // });
// // c.connect(function(err){
// //         if (err) throw err;
// //         console.log("Connected!");
// // });

// const db = require("./db");

// async function asyncFunction() {
//         let conn;
//         try {
//                 // Acquire a connection from the connection pool
//                 conn = await db.pool.getConnection();
                
//                 // Create new db
//                 await conn.query("CREATE DATABASE IF NOT EXISTS groupify");
//                 console.log("Groupify database created.");
//                 conn.query('USE groupify;');
//                 console.log("DB selected!")
//                 // Execute query to create new tables
//                 conn.query('CREATE TABLE IF NOT EXISTS user (' +
//                         '  UserID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
//                         '  Username VARCHAR(100) NOT NULL,' +
//                         '  Password VARCHAR(100) NOT NULL );');
//                 console.log("User table created.")
//                 conn.query('CREATE TABLE IF NOT EXISTS track (' +
//                         '  TrackID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
//                         '  SpotifyID VARCHAR(22) NOT NULL,' +
//                         '  Votes INT NOT NULL,' +
//                         '  Blacklist INT );');
//                 console.log("Track table created.")
//                 conn.query('CREATE TABLE IF NOT EXISTS vote (' +
//                         '  VoteID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
//                         '  TrackID VARCHAR(22) NOT NULL,' +
//                         '  UserID INT NOT NULL,' +
//                         '  Play BOOLEAN NOT NULL );');
//                 console.log("Vote table created.")
//                 conn.query('UPDATE track SET Blacklist=NULL;'); // Reset blacklist          
//         } catch (err) {
//                 console.log(err)
//         } finally {
//                 if (conn) await conn.release();
//                         db.pool.release();
//         }
// }

// asyncFunction();

// // c.query('CREATE DATABASE IF NOT EXISTS groupify;');

// // c.query('USE groupify;');
// // console.log("DB selected!")
// // c.query('CREATE TABLE IF NOT EXISTS user (' +
// //          '  UserID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
// //          '  Username VARCHAR(100) NOT NULL,' +
// //          '  Password VARCHAR(100) NOT NULL );');

// // c.query('CREATE TABLE IF NOT EXISTS track (' +
// //         '  TrackID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
// //         '  SpotifyID VARCHAR(22) NOT NULL,' +
// //         '  Votes INT NOT NULL,' +
// //         '  Blacklist INT );');

// // c.query('CREATE TABLE IF NOT EXISTS vote (' +
// //         '  VoteID INT NOT NULL PRIMARY KEY AUTO_INCREMENT,' +
// //         '  TrackID VARCHAR(22) NOT NULL,' +
// //         '  UserID INT NOT NULL,' +
// //         '  Play BOOLEAN NOT NULL );');

// // c.query('UPDATE track SET Blacklist=NULL;'); // Reset blacklist

// // c.release();
