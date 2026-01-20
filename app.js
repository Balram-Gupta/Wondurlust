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


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

 const dbURL = process.env.ATLASDB_URL;

main().then(()=>{
    console.log("connection successful");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(dbURL);
}

const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: { secret: process.env.SECRET },
  touchAfter: 24 * 3600,
});


store.on("Error", ()=>{
  console.log("Error in Mongo Session Store", Error);
});

const sessionOptions = {
  store,
  secret : process.env.SECRET ,
  resave: false,
  saveUninitialized : true,
  cookie : {
    expires : Date.now() + 7 * 24 * 60 * 60 *1000,
   maxAge:  7 * 24 * 60 * 60 *1000
  }
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// app.get("/demoUser", async (req, res)=>{
//   let fakeUser = new User({
//     email : "Student@gmail.com",
//     username : "Balram",
//   });
      
//   let newUser =await User.register(fakeUser, "ABCD");
//    res.send(newUser);
  
// });

app.use("/listing", listingRouter);
app.use("/listing/:id/reviews", reviewRouter);
app.use("/", userRouter);


app.all("*", (req, res, next)=>{
  next(new ExpressError(404, "Page Not Found"));
})

app.use((err, req, res, next) => {
  let { code = 500, message = "Something Went Wrong" } = err;
res.status(code).json({
  error: message
});
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("App is listening on port", PORT);
});
