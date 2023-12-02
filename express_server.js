const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { userLookUp } = require("./helpers")
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: {
    longURL: "http://www.lighthouselabs.ca",
    user_id: "9GmQvA",
  },
  asm5xK: {
    longURL: "http://www.google.com",
    user_id: "9GmQvA",
  },
  aer345: {
    longURL: "http://www.google.com",
    user_id: "iA8rAO",
  }
};

const users = {};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  return res.status(statusCode || 500).json({
    error: statusCode,
    message: err.message
  });
};

const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlsForUser = (id) => {
  let result = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].user_id === id) {
      result[url] = { longURL: urlDatabase[url].longURL };
    } 
  }
  return result
}

app.use(errorHandler);
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['LHL'],
}))

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls", (req, res) => {
  if (!(req.session.user_id in users)) {
    req.session = null;
    return res.status(401).send('Please login in order to use the app');
  };
  const urls = urlsForUser(req.session["user_id"]);
  const templateVars = {
    user: users[req.session["user_id"]],
    urls
  };
 
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]]
  };
  if (!req.session.user_id) {
    return res.redirect("/login");
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Please login in order to use the app');
  };
  if (urlDatabase[req.params.id].user_id !== req.session.user_id) {
    return res.status(403).send('Access Denied');
  };
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  };

  const templateVars = {
    user: users[req.session["user_id"]],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };
  
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  };
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]]
  };
  if (req.session.user_id) {
    return res.redirect("/urls");
  };
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session["user_id"]]
  };
  if (req.session.user_id) {
    return res.redirect("/urls");
  };
  res.render("login", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Please login in order to use the app');
  };
  if (urlDatabase[req.params.id].user_id !== req.session.user_id) {
    return res.status(403).send('Access Denied');
  };
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  };
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Please login in order to use the app');
  };
  if (urlDatabase[req.params.id].user_id !== req.session.user_id) {
    return res.status(403).send('Access Denied');
  };
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('URL code not found');
  };
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).send('Please login in order to use the app');
  };
  let id = generateRandomString();
  urlDatabase[id] = {
    longURL: req.body.longURL,
    user_id: req.session.user_id
  };
  res.redirect(`/urls/${id}`);
});

app.post("/login", (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Please enter both email and password');
  }
  let userProfile = userLookUp(req.body.email, users);
  if (!userProfile) {
    return res.status(403).send('Email is not registered!');
  }
  if (!bcrypt.compareSync(req.body.password, userProfile.hashedPassword)) {
    return res.status(403).send('Password is incorrect!');
  }
  req.session.user_id = userProfile.id;
  res.redirect("/urls");
});

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
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = {id, email, hashedPassword};
  users[id] = user;
  req.session.user_id = id;
  res.redirect("/urls");
});