// routes/paymentRoute.js
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

// ✅ SAFE Razorpay initialization
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay initialized");
} else {
  console.warn("⚠️ Razorpay keys missing. Payment routes disabled.");
}

// ✅ Create order
router.post("/create-order", async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({
      message: "Payment service unavailable",
    });
  }

  try {
    const options = {
      amount: 100 * 100, // ₹100
      currency: "INR",
      receipt: `donation_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("❌ Error creating order:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// ✅ Verify payment signature
router.post("/verify", (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(503).json({
      message: "Payment verification unavailable",
    });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign === razorpay_signature) {
      return res.json({
        success: true,
        message: "✅ Payment verified successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "❌ Invalid signature",
      });
    }
  } catch (err) {
    console.error("❌ Payment verification failed:", err);
    res.status(500).json({ error: "Payment verification failed" });
  }
});

module.exports = router;
