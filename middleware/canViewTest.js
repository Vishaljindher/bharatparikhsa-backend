const bcrypt = require("bcryptjs");

// ✅ Middleware: Access control for viewing a test
const canViewTest = async (req, res, next) => {
  try {
    const test = req.test;
    const user = req.user; // from authMiddleware
    const shareToken = req.query.shareToken || req.headers["x-share-token"];
    const sharePassword = req.query.sharePassword || req.body?.sharePassword;

    // 1️⃣ Public test — anyone can access
    if (test.visibility === "public") {
      return next();
    }

    // 2️⃣ Logged-in owner
    if (user && String(test.createdBy._id) === String(user._id)) {
      return next();
    }

    // 3️⃣ Invited users
    if (user && test.sharedWith.some(id => String(id) === String(user._id))) {
      return next();
    }

    // 4️⃣ Shared link access via token
    if (shareToken) {
      const link = test.shareLinks.find(l =>
        l.token === shareToken &&
        (!l.expiresAt || new Date(l.expiresAt) > Date.now()) &&
        (l.usesLeft === null || l.usesLeft > 0)
      );

      if (link) {
        // 🔐 If link is password protected
        if (link.passwordHash) {
          const isMatch = await bcrypt.compare(sharePassword || "", link.passwordHash);
          if (!isMatch) {
            return res.status(401).json({ message: "Invalid or missing share password" });
          }
        }

        // ✅ Optional: decrement usesLeft if applicable
        if (link.usesLeft && link.usesLeft > 0) {
          link.usesLeft -= 1;
          await test.save();
        }

        return next();
      }
    }

    // ❌ No access
    return res.status(403).json({ message: "You do not have access to this test" });
  } catch (error) {
    console.error("Error in canViewTest middleware:", error);
    res.status(500).json({ message: "Server error during access check" });
  }
};

module.exports = { canViewTest };
