const userLookUp = (email, database) => {
  for (const userID in database) {
    if (database[userID]['email'] === email) {
      return database[userID].id;
    }
  }
  return null;
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

module.exports = { userLookUp, generateRandomString }