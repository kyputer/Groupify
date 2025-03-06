import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import users from './db/users.js';

passport.use(new LocalStrategy(
  function(username, password, done) {
    users.strategy(username, password, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Incorrect username or password.' }); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  users.findById(id, function(err, user) {
    done(err, user);
  });
});