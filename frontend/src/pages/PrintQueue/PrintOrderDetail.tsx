import { useSelector } from "react-redux";
import { selectWorkflowOrderDetail } from "../../features/workflow/workflowSlice";
import type { AdminOrder } from "../../features/admin/adminSlice";
import { API_BASE } from "../../shared/utils/apiBase";
import QueueOrderDetail from "../Queue/QueueOrderDetail";

// ── Job-card HTML generator ────────────────────────────────────────────────────

function buildJobCardHtml(order: AdminOrder, apiBase: string): string {
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  const itemsHtml = order.items
    .map((item, idx) => {
      const imgSrc = item.thumbnail_url ? `${apiBase}${item.thumbnail_url}` : null;
      const imageBlock = imgSrc
        ? `<img class="card-img" src="${imgSrc}" alt="Card design" />`
        : `<div class="card-img-placeholder">No preview</div>`;

      const rows = [
        ["Card Type",    item.card_type],
        ["Print Side",   item.print_side],
        ["Orientation",  item.orientation],
        ["Finish",       item.finish],
        ["Chip Type",    item.chip_type],
        ["Material",     item.material],
      ]
        .map(([label, value]) => `
          <tr>
            <td class="spec-label">${label}</td>
            <td class="spec-value">${value}</td>
          </tr>`)
        .join("");

      return `
        <div class="item">
          <div class="item-header">
            <span>Item ${idx + 1}${order.items.length > 1 ? ` of ${order.items.length}` : ""}</span>
            <span class="item-qty">QTY: ${item.quantity}</span>
          </div>
          <div class="item-body">
            <div class="preview-col">
              ${imageBlock}
              <div class="preview-label">Card Design Preview</div>
            </div>
            <div class="specs-col">
              <table class="specs-table">
                <tbody>
                  ${rows}
                  <tr class="qty-row">
                    <td class="spec-label">Quantity</td>
                    <td class="spec-value qty-value">${item.quantity}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Job Card — #${order.order_number}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      background: #fff;
      color: #1e293b;
      padding: 28px 32px;
      font-size: 13px;
    }

    /* ── Top header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 14px;
      border-bottom: 3px solid #e05c1a;
      margin-bottom: 20px;
    }
    .header-left .badge {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 3px;
      color: #e05c1a;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header-left .title {
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 1px;
    }
    .header-right {
      text-align: right;
    }
    .header-right .order-num {
      font-size: 20px;
      font-weight: 800;
      color: #e05c1a;
    }
    .header-right .meta {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.6;
    }

    /* ── Customer strip ── */
    .customer-strip {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 0;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 22px;
    }
    .customer-strip .field label {
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: block;
      margin-bottom: 3px;
    }
    .customer-strip .field span {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }

    /* ── Items ── */
    .item {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 18px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .item-header {
      background: #1e293b;
      color: #fff;
      padding: 9px 16px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item-qty {
      font-size: 13px;
      font-weight: 900;
      color: #fb923c;
      letter-spacing: 1px;
    }
    .item-body {
      display: flex;
      gap: 24px;
      padding: 18px;
    }

    /* ── Card preview column ── */
    .preview-col {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .card-img {
      width: 220px;
      height: 138px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      display: block;
    }
    .card-img-placeholder {
      width: 220px;
      height: 138px;
      border-radius: 10px;
      border: 2px dashed #cbd5e1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      font-size: 12px;
      font-style: italic;
    }
    .preview-label {
      font-size: 10px;
      color: #94a3b8;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    /* ── Specs column ── */
    .specs-col {
      flex: 1;
    }
    .specs-table {
      width: 100%;
      border-collapse: collapse;
    }
    .specs-table tr {
      border-bottom: 1px solid #f1f5f9;
    }
    .specs-table tr:last-child {
      border-bottom: none;
    }
    .spec-label {
      padding: 9px 10px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      width: 130px;
      background: #f8fafc;
    }
    .spec-value {
      padding: 9px 10px;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
    }
    .qty-row .spec-label,
    .qty-row .spec-value {
      background: #fff8f2;
      border-top: 2px solid #fed7aa;
    }
    .qty-value {
      font-size: 20px;
      font-weight: 900;
      color: #e05c1a;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }

    /* ── Print overrides ── */
    @media print {
      body { padding: 0; }
      @page { margin: 12mm 14mm; size: A4; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      <div class="badge">ID Card Designer</div>
      <div class="title">JOB CARD</div>
    </div>
    <div class="header-right">
      <div class="order-num">#${order.order_number}</div>
      <div class="meta">
        Date: ${dateStr}<br/>
        Total Cards: ${order.total_cards}<br/>
        Status: ${order.status}
      </div>
    </div>
  </div>

  <div class="customer-strip">
    <div class="field">
      <label>Customer</label>
      <span>${order.customer_name ?? "—"}</span>
    </div>
    <div class="field">
      <label>Email</label>
      <span>${order.customer_email ?? "—"}</span>
    </div>
    <div class="field">
      <label>Payment</label>
      <span>${order.payment_method ?? "—"}</span>
    </div>
  </div>

  ${itemsHtml}

  <div class="footer">
    <span>Printed on ${new Date().toLocaleString("en-IN")}</span>
    <span>Order #${order.order_number} — ID Card Designer</span>
  </div>

  <script>
    window.onload = function () { window.print(); };
  </script>
</body>
</html>`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function PrintOrderDetail() {
  const order = useSelector(selectWorkflowOrderDetail);

  const handlePrintJobCard = () => {
    if (!order) return;
    const html = buildJobCardHtml(order, API_BASE);
    const win = window.open("", "_blank", "width=960,height=760,scrollbars=yes");
    if (!win) {
      alert("Pop-up blocked. Please allow pop-ups for this site to print the job card.");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div>
      {/* Print Job Card button — shown once order data is loaded */}
      {order && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button
            onClick={handlePrintJobCard}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 22px",
              background: "linear-gradient(135deg, #e05c1a, #f97316)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(224,92,26,0.35)",
              letterSpacing: 0.3,
            }}
          >
            <span style={{ fontSize: 16 }}>🖨</span>
            Print Job Card
          </button>
        </div>
      )}

      <QueueOrderDetail queue="print-queue" />
    </div>
  );
}
