const express = require("express");
const methodOverride = require('method-override');
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { userLookUp, generateRandomString, urlsForUser } = require("./helpers");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {};
const users = {};

// general express error handler
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode || 500).json({
    error: statusCode,
    message: err.message
  });
};

// Middleware
app.use(errorHandler);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['LHL'],
}));

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// Routes
app.get("/", (req, res) => {
  // if not logged or logged userID doesn't match Database, redirect to /login
  if (!(req.session.userId in users)) {
    return res.redirect("/login");
  }
  res.redirect("/urls");
});

app.get("/urls", (req, res) => {
  // if not logged or logged userID doesn't match Database, clear cookies and request login
  if (!(req.session.userId in users)) {
    req.session = null;
    return res.status(401).send('Please login in order to use the app');
  }
  // logged user info and owned URLs passed to ejs template
  const urls = urlsForUser(req.session["userId"], urlDatabase);
  const templateVars = {
    user: users[req.session["userId"]],
    urls
  }; 
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  // if not logged or logged userID doesn't match Database, redirect to /login
  if (!(req.session.userId in users)) {
    return res.redirect("/login");
  }
  const templateVars = {
    user: users[req.session["userId"]]
  };
  res.render("urls_new", templateVars);
});

// URL view and edit page
app.get("/urls/:id", (req, res) => {
  // if not logged or logged userID doesn't match Database, request to login
  if (!(req.session.userId in users)) {
    return res.status(401).send('Please login in order to use the app');
  }
  // if id is invalid
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  }
  // if id does not belong to logged user
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.status(403).send('Access Denied');
  }
  // visit log and count info passed to ejs template
  let visitCount = 0;
  for (let key in urlDatabase[req.params.id].visitLog) {
    visitCount += urlDatabase[req.params.id].visitLog[key].length;
  }

  const templateVars = {
    user: users[req.session["userId"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    visitLog: urlDatabase[req.params.id].visitLog,
    visitCount
  };
  
  res.render("urls_show", templateVars);
});

// shortened URL redirect
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  }
  // cookie set to track visits and visitors
  if (req.session.visitorId) {
    urlDatabase[req.params.id].visitLog[req.session.visitorId].push(new Date());
  } else {
    req.session.visitorId = generateRandomString();
    urlDatabase[req.params.id].visitLog[req.session.visitorId] = [new Date()];
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session["userId"]]
  };
  // if already logged
  if (req.session.userId) {
    return res.redirect("/urls");
  }
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session["userId"]]
  };
  // if already logged
  if (req.session.userId) {
    return res.redirect("/urls");
  }
  res.render("login", templateVars);
});

app.delete("/urls/:id/delete", (req, res) => {
  // if not logged or logged userID doesn't match Database, request to login
  if (!(req.session.userId in users)) {
    return res.status(401).send('Please login in order to use the app');
  }
  // if id is invalid
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  }
  // if id does not belong to logged user
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.status(403).send('Access Denied');
  }
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.put("/urls/:id", (req, res) => {
  // if not logged or logged userID doesn't match Database, request to login
  if (!(req.session.userId in users)) {
    return res.status(401).send('Please login in order to use the app');
  }
  // if id is invalid
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  }
  // if id does not belong to logged user
  if (urlDatabase[req.params.id].userId !== req.session.userId) {
    return res.status(403).send('Access Denied');
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  // if not logged or logged userID doesn't match Database, request to login
  if (!(req.session.userId in users)) {
    return res.status(401).send('Please login in order to use the app');
  }
  let id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    userId: req.session.userId,
    visitLog: {}
  };
  res.redirect(`/urls/${id}`);
});

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Please enter both email and password');
  }
  let userProfile = users[userLookUp(req.body.email, users)];
  if (!userProfile) {
    return res.status(403).send('Email is not registered!');
  }
  if (!bcrypt.compareSync(req.body.password, userProfile.hashedPassword)) {
    return res.status(403).send('Password is incorrect!');
  }
  req.session.userId = userProfile.id;
  res.redirect("/urls");
});

// clear cookies for logging out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
    
  if (!email || !password) {
    return res.status(400).send('Please enter both email and password');
  }
  if (userLookUp(email, users)) {
    return res.status(400).send('Email is already registered!');
  }
  // new user data registration
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = {id, email, hashedPassword};
  users[id] = user;
  req.session.userId = id;
  res.redirect("/urls");
});