import jwt from "jsonwebtoken";

const secret = process.env.ACCESS_TOKEN_SECRET || "my secret";

// Generate token (used in Login)
export function generateToken(data) {
  const token = jwt.sign(data, secret, { expiresIn: "100000000000" });
  return token;
}

// Custom JWT middleware function

export function authorize(req, res, next) {
  const authHeader = req.headers.authorization; // authorHeader == {Bearer [token...]}
  const token = authHeader ? authHeader.split(" ")[1] : null; // [token...]

  if (!token) {
    console.error("no token sent to server");
    res.status(401).send({ error: "no token sent to server" });
    return;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, secret);
  } catch (error) {
    console.error(error);
    res.status(403).send({ error: "Invalid Token" });
    return;
  }

  req.user = decoded; // {header, payload, signature} ..?

  next();
}
