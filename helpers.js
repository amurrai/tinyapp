// Looks for user ID from provided email
const userLookUp = (email, database) => {
  for (const userID in database) {
    if (database[userID]['email'] === email) {
      return database[userID].id;
    }
  }
  return null;
};

// Generates random 6 char string
const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// Returns URLs owned by the provided User ID
const urlsForUser = (id, database) => {
  let result = {};
  for (const url in database) {
    if (database[url].userId === id) {
      result[url] = { longURL: database[url].longURL };
    }
  }
  return result;
};

module.exports = { userLookUp, generateRandomString, urlsForUser }