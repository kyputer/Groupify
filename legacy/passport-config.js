import passport from 'passport';
import LocalStrategy from 'passport-local';
import users from './db/users.js';
import bcrypt from 'bcryptjs';

// Serialize user into session
passport.serializeUser((user, done) => {
  if (!user || !user.id) {
    console.error('Error: User object is missing an id during serialization');
    return done(new Error('User object is missing an id'));
  }
  console.log('Serializing user:', user.id);
  done(null, user.id); // Use a unique identifier like user.id
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    console.log(`Deserializing user: ${id}`);
    const user = await users.findById(id);
    console.log('User deserialized successfully:', user);
    done(null, user);
  } catch (err) {
    console.error('Error during deserialization:', err);
    done(err);
  }
});

// Configure local strategy
passport.use(new LocalStrategy(
  async function(username, password, done) {
    try {
      console.log(`Authenticating user: ${username}`);
      const user = await users.findByUsername(username);
      if (!user) {
        console.log('User not found');
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        console.log('Incorrect password');
        return done(null, false, { message: 'Incorrect username or password.' });
      }
      console.log('Authentication successful');
      return done(null, user);
    } catch (err) {
      console.error('Error during authentication:', err);
      return done(err);
    }
  }
));

export default passport;