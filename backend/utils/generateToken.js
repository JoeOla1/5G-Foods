const jwt = require("jsonwebtoken");

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

module.exports = generateToken;
