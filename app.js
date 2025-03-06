import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { fileURLToPath } from 'url';
import session from 'express-session';
import path from 'path';
//import favicon from 'serve-favicon';
import passport from 'passport';
import indexRouter from './routes/index.js'; 
import LocalStrategy from "passport-local";
import bcrypt from 'bcryptjs';

import { initializeDatabase, findUserByUsername, pool} from "./db/db.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

import { updateForeignPlaylist } from './updateForeignPlaylist.js';

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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Mount your route(s)
app.use('/', indexRouter);

// Set up session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret", 
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

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

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  let conn;
  try {
    conn = await getDBConnection();
    const rows = await conn.query("SELECT * FROM users WHERE id = ?", [id]);
    if (rows.length > 0) {
      done(null, rows[0]);
    } else {
      done(null, false);
    }
  } catch (err) {
    done(err);
  } finally {
    if (conn) await conn.release();
  }
});

// Initialize database before starting the server
// (async () => {
//   try {
//     await initializeDatabase();
//     console.log("Database is ready. Starting server...");

//     app.get("/", (req, res) => {
//       res.send("Groupify API is running!");
//     });

//     app.listen(port, () => {
//       console.log(`Server running on http://localhost:${port}`);
//     });
//   } catch (error) {
//     console.error("Error initializing database:", error);
//     process.exit(1);
//   }
// })();



/* Step 3: Add Authentication Routes
Modify app.js to include login/logout routes.
Add Authentication Endpoints*/

// Login route
app.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ message: "Login successful", user: req.user });
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