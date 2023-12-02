const userLookUp = (email, database) => {
  for (const userID in database) {
    if (database[userID]['email'] === email) {
      return database[userID].id;
    }
  }
  return null;
};

module.exports = { userLookUp }