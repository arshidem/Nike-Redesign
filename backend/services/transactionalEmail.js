const { sendEmail } = require("./emailService");

const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const frame = (body) =>
  `<div style="font-family:Arial,sans-serif;background:#f8f8f3;padding:32px;color:#171813"><div style="max-width:600px;margin:auto;background:white;border-top:5px solid #d9ff43;padding:28px"><p style="font-size:11px;letter-spacing:2px;color:#596d3e">TRIODE STUDIO / INDEPENDENT STOREFRONT</p>${body}<hr style="border:0;border-top:1px solid #daddd0;margin-top:28px"><p style="font-size:11px;color:#6b7161">This independent project is not affiliated with Nike, Inc.</p></div></div>`;

async function sendOTP(email, otp) {
  return sendEmail({
    to: email,
    kind: "otp",
    subject: "Your sign-in verification code",
    html: frame(
      `<h1 style="font-size:28px">Your next move.</h1><p>Use this code to continue signing in:</p><p style="font-size:36px;letter-spacing:8px;font-weight:bold">${escapeHtml(otp)}</p><p>This code expires in 5 minutes. Do not share it.</p><p>If you did not request this code, you can ignore this email.</p>`,
    ),
    text: `Your verification code is ${otp}. It expires in 5 minutes. Do not share it. If you did not request it, ignore this email.`,
  });
}

async function sendOrderConfirmation(email, order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const itemText = items
    .map(
      (item) =>
        `${item.title || item.name || "Item"} (${item.color || ""}, Size ${item.size || ""}) — ${item.quantity} × ${money(item.price)} = ${money(item.price * item.quantity)}`,
    )
    .join("\n");
  const rows = items
    .map(
      (item) =>
        `<tr><td style="padding:12px;border-bottom:1px solid #daddd0">${escapeHtml(item.title || item.name || "Item")}<br><small>${escapeHtml(item.color)} / Size ${escapeHtml(item.size)}</small></td><td style="padding:12px">${escapeHtml(item.quantity)}</td><td style="padding:12px">${escapeHtml(money(item.price))}</td><td style="padding:12px">${escapeHtml(money(item.price * item.quantity))}</td></tr>`,
    )
    .join("");
  return sendEmail({
    to: email,
    kind: "order_confirmation",
    idempotencyKey: `order-confirmation-${order._id}`,
    subject: `Order confirmation #${order._id}`,
    html: frame(
      `<h1 style="font-size:28px">Thank you, ${escapeHtml(order.customerName || "Customer")}.</h1><p>Your order <strong>#${escapeHtml(order._id)}</strong> has been placed.</p><table style="width:100%;border-collapse:collapse;text-align:left"><thead style="background:#eeeee6"><tr><th style="padding:12px">Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><p><strong>Order total: ${escapeHtml(money(order.totalPrice))}</strong></p><p>Check your account for order status and delivery updates.</p>`,
    ),
    text: `Thank you, ${order.customerName || "Customer"}.\nOrder #${order._id}\n\n${itemText}\n\nOrder total: ${money(order.totalPrice)}\nCheck your account for order status and delivery updates.`,
  });
}

module.exports = { sendOTP, sendOrderConfirmation };
