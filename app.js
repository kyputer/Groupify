import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { fileURLToPath } from 'url';
import session from 'express-session';
import path from 'path';
import passport from 'passport';
import indexRouter from './routes/index.js'; 
import LocalStrategy from "passport-local";
import bcrypt from 'bcryptjs';
import flash from 'connect-flash'

import './passport-config.js'; // Ensure this line is added to import the Passport configuration


import { getDBConnection, findUserByUsername, initializeDatabase, pool} from "./db/db.js";
import { updateForeignPlaylist } from './updateForeignPlaylist.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret", 
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize connect-flash
app.use(flash());

// Initialize Passport and restore authentication state, if any, from the session
app.use(passport.initialize());
app.use(passport.session());

// Middleware to log each request
app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

// Middleware to handle request timeouts
app.use((req, res, next) => {
  const timeout = setTimeout(() => {
    console.error('Request timed out');
    res.status(504).json({ error: 'Request timed out' });
  }, 10000); // 10 seconds timeout

  res.on('finish', () => clearTimeout(timeout));
  next();
});

// Mount your route(s)
app.use('/', indexRouter);


(async () => {
  try {
    console.log("Initializing database...");
    await initializeDatabase(); // Ensure DB is ready
    console.log("Database initialized successfully!");

    // Now start using tracks.js safely
    console.log("Starting server...");
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });

  } catch (err) {
    console.error("Error initializing database:", err);
    process.exit(1); // Stop if DB fails
  }
})();

// Set up the view engine (using EJS in this example)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware to serve static assets (e.g., CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Serve Semantic UI assets from the semantic folder
app.use('/semantic', express.static(path.join(__dirname, 'semantic')));




// Passport Local Strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await findUserByUsername(username);
      if (!user) return done(null, false, { message: "Incorrect username." });

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) return done(null, false, { message: "Incorrect password." });

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

/* Step 3: Add Authentication Routes
Modify app.js to include login/logout routes.
Add Authentication Endpoints*/

// Login route
app.post("/login", (req, res, next) => {
  console.log(`Login attempt for user: ${req.body.username}`);
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error('Error during login:', err);
      return next(err);
    }
    if (!user) {
      console.log('Login failed:', info.message);
      return res.status(401).json({ message: info.message });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error('Error during login:', err);
        return next(err);
      }
      console.log('Login successful');
      return res.json({ message: "Login successful", user: req.user });
    });
  })(req, res, next);
});

// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout failed" });
    res.json({ message: "Logged out successfully" });
  });
});


// Global error handler
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Something went wrong!' });
});