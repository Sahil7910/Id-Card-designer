import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.config import settings
from app.models.order import Order

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD and settings.SMTP_FROM_EMAIL)


def _delivery_estimate(shipping_method: str) -> str:
    return {
        "standard": "5–7 business days",
        "express": "2–3 business days",
        "overnight": "1 business day",
    }.get(shipping_method, "5–7 business days")


def _build_html(order: Order, recipient_name: str) -> str:
    addr = order.shipping_address or {}
    address_line = f"{addr.get('address1', '')}"
    if addr.get("address2"):
        address_line += f", {addr['address2']}"
    city_line = f"{addr.get('city', '')}, {addr.get('state', '')} {addr.get('zip', '')}".strip(", ")

    # Items rows
    items_rows = ""
    for item in order.items:
        items_rows += f"""
        <tr style="border-bottom:1px solid #2a3050;">
          <td style="padding:10px 12px;color:#e2e8f0;">{item.card_type}</td>
          <td style="padding:10px 12px;color:#94a3b8;">{item.finish} / {item.material}</td>
          <td style="padding:10px 12px;color:#94a3b8;text-align:center;">{item.quantity}</td>
          <td style="padding:10px 12px;color:#94a3b8;text-align:right;">₹{item.unit_price:.2f}</td>
          <td style="padding:10px 12px;color:#e2e8f0;text-align:right;font-weight:600;">₹{item.total_price:.2f}</td>
        </tr>"""

    # Pricing rows
    discount_row = ""
    if float(order.promo_discount or 0) > 0:
        discount_row = f"""
        <tr>
          <td style="padding:6px 0;color:#4ade80;">Promo Discount</td>
          <td style="padding:6px 0;color:#4ade80;text-align:right;">-₹{float(order.promo_discount):.2f}</td>
        </tr>"""

    shipping_label = order.shipping_method.capitalize() if order.shipping_method else "Standard"
    shipping_cost_str = "FREE" if float(order.shipping_cost or 0) == 0 else f"₹{float(order.shipping_cost):.2f}"

    return f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Order Confirmed – {order.order_number}</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#1a2035;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
        <div style="font-size:22px;font-weight:700;color:#f97316;letter-spacing:1px;">🪪 ID Card Designer</div>
        <div style="font-size:13px;color:#64748b;margin-top:4px;">Professional ID Card Printing</div>
      </td></tr>

      <!-- Confirmation banner -->
      <tr><td style="background:#16a34a18;border:1px solid #16a34a33;padding:28px 40px;text-align:center;">
        <div style="font-size:40px;margin-bottom:8px;">✅</div>
        <div style="font-size:24px;font-weight:700;color:#4ade80;">Your Order is Confirmed!</div>
        <div style="font-size:15px;color:#94a3b8;margin-top:8px;">Hi {recipient_name}, thank you for your order.</div>
        <div style="display:inline-block;background:#1e293b;border:1px solid #334155;border-radius:8px;padding:10px 24px;margin-top:16px;">
          <span style="font-size:13px;color:#64748b;">Order Number</span><br>
          <span style="font-size:20px;font-weight:700;color:#f97316;letter-spacing:2px;">{order.order_number}</span>
        </div>
      </td></tr>

      <!-- Order items -->
      <tr><td style="background:#13161d;padding:28px 40px;">
        <div style="font-size:16px;font-weight:600;color:#e2e8f0;margin-bottom:16px;">Order Items</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #1e293b;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#1e293b;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Card Type</th>
              <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Finish / Material</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Qty</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Unit</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;">Total</th>
            </tr>
          </thead>
          <tbody>{items_rows}
          </tbody>
        </table>
      </td></tr>

      <!-- Pricing summary -->
      <tr><td style="background:#13161d;padding:0 40px 28px;">
        <div style="background:#1e293b;border-radius:8px;padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;color:#94a3b8;">Subtotal</td>
              <td style="padding:6px 0;color:#94a3b8;text-align:right;">₹{float(order.subtotal):.2f}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;">Shipping ({shipping_label})</td>
              <td style="padding:6px 0;color:#94a3b8;text-align:right;">{shipping_cost_str}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#94a3b8;">Tax (5%)</td>
              <td style="padding:6px 0;color:#94a3b8;text-align:right;">₹{float(order.tax):.2f}</td>
            </tr>
            {discount_row}
            <tr style="border-top:1px solid #334155;">
              <td style="padding:12px 0 4px;color:#e2e8f0;font-size:16px;font-weight:700;">Grand Total</td>
              <td style="padding:12px 0 4px;color:#f97316;font-size:18px;font-weight:700;text-align:right;">₹{float(order.grand_total):.2f}</td>
            </tr>
          </table>
        </div>
      </td></tr>

      <!-- Shipping address + delivery -->
      <tr><td style="background:#13161d;padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="50%" valign="top" style="padding-right:12px;">
              <div style="background:#1e293b;border-radius:8px;padding:16px 20px;height:100%;">
                <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;margin-bottom:10px;">📦 Shipping To</div>
                <div style="color:#e2e8f0;font-size:14px;line-height:1.8;">
                  {addr.get('first_name','')} {addr.get('last_name','')}<br>
                  {address_line}<br>
                  {city_line}<br>
                  {addr.get('country','')}<br>
                  <span style="color:#94a3b8;">{addr.get('phone','')}</span>
                </div>
              </div>
            </td>
            <td width="50%" valign="top" style="padding-left:12px;">
              <div style="background:#1e293b;border-radius:8px;padding:16px 20px;height:100%;">
                <div style="font-size:12px;color:#64748b;text-transform:uppercase;font-weight:600;margin-bottom:10px;">🚚 Estimated Delivery</div>
                <div style="color:#4ade80;font-size:18px;font-weight:700;margin-bottom:4px;">{_delivery_estimate(order.shipping_method)}</div>
                <div style="color:#64748b;font-size:13px;">{shipping_label} shipping</div>
              </div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#1a2035;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
        <div style="font-size:13px;color:#64748b;line-height:1.8;">
          Questions about your order? Reply to this email and we'll help you.<br>
          <span style="color:#334155;">© 2025 ID Card Designer. All rights reserved.</span>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""


async def send_order_confirmation(
    order: Order,
    recipient_email: str,
    recipient_name: str,
) -> None:
    """Send an HTML order confirmation email. Never raises — failures are logged only."""
    if not _smtp_configured():
        logger.debug("SMTP not configured – skipping order confirmation email for %s", order.order_number)
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Order Confirmed – {order.order_number}"
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = recipient_email

        # Plain-text fallback
        plain = (
            f"Hi {recipient_name},\n\n"
            f"Your order {order.order_number} has been confirmed!\n\n"
            f"Grand Total: ₹{float(order.grand_total):.2f}\n"
            f"Estimated Delivery: {_delivery_estimate(order.shipping_method)}\n\n"
            "Thank you for choosing ID Card Designer."
        )
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(_build_html(order, recipient_name), "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            start_tls=True,
        )

        logger.info("Order confirmation email sent to %s for %s", recipient_email, order.order_number)

    except Exception as exc:
        logger.error(
            "Failed to send order confirmation email for %s: %s",
            order.order_number,
            exc,
            exc_info=True,
        )
