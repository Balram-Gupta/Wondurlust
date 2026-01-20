require('dotenv').config();

let express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const flash = require("connect-flash");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');

const passport = require("passport");
const LocalStrategy = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");

// Check environment variables
if (!process.env.ATLASDB_URL) {
  console.error("❌ ATLASDB_URL is not defined in environment variables");
}

if (!process.env.SECRET) {
  console.error("❌ SECRET is not defined in environment variables");
}

// Middleware setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const dbURL = process.env.ATLASDB_URL;

async function main() {
  try {
    await mongoose.connect(dbURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connection successful");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
}

main();

// Session store
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});

store.on("error", (error) => {
  console.log("❌ Error in Mongo Session Store:", error);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true
  }
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listing");
});

// Routes
app.use("/listing", listingRouter);
app.use("/listing/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 handler
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Error handler
app.use((err, req, res, next) => {
  let { code = 500, message = "Something Went Wrong" } = err;
  res.status(code).render("error", { message });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ App is listening on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
});
