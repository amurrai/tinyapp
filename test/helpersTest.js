const { assert } = require('chai');

const { userLookUp } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('userLookUp', function() {
  it('should return a user with valid email', function() {
    const user = userLookUp("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.equal(user, expectedUserID);
  });

  it('should return null with invalid email', function() {
    const user = userLookUp("invalid@example.com", testUsers)
    assert.equal(user, null);
  });
});


