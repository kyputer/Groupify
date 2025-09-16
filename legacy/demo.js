/**
 * Run `node demo.js` to build these fake user profiles
 */
require('dotenv').config();
var db = require('./db');

db.users.register('foo', 'bar', function(a,b){return;});
db.users.register('judging', 'judging', function(a,b){return;});
db.users.register('wakaflockaflame', 'wakaflockaflame', function(a,b){return;});
