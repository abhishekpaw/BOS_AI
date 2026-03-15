export function requireAuth(req, res, next) {
  const userId = req.header("x-user-id");

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = { id: userId };
  next();
}