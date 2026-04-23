import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { AppDispatch, RootState } from "../../app/store";
import {
  fetchQueueOrderDetail,
  fetchOrderAudit,
  fetchOrderAttachments,
  uploadAttachment,
  updateTracking,
  selectWorkflowOrderDetail,
  selectWorkflowAuditLogs,
  selectWorkflowAttachments,
  selectWorkflowDetailLoading,
  selectWorkflowUploadLoading,
  selectWorkflowTrackingLoading,
  workflowActions,
} from "../../features/workflow/workflowSlice";
import { updateOrderStatus } from "../../features/admin/adminSlice";
import { API_BASE } from "../../shared/utils/apiBase";
import { STATUS_COLORS, ROLE_ALLOWED_STATUSES, statusLabel } from "./queueConstants";

interface QueueOrderDetailProps {
  queue: "design-queue" | "print-queue" | "shipping-queue";
  showAttachmentUpload?: boolean;
  splitUploadForms?: boolean;
  showTrackingPanel?: boolean;
  backLabel?: string;
}

export default function QueueOrderDetail({
  queue,
  showAttachmentUpload = false,
  splitUploadForms = false,
  showTrackingPanel = false,
  backLabel = "← Back to queue",
}: QueueOrderDetailProps) {
  const { orderId } = useParams<{ orderId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const user = useSelector((state: RootState) => state.auth.user);
  const order = useSelector(selectWorkflowOrderDetail);
  const auditLogs = useSelector(selectWorkflowAuditLogs);
  const attachments = useSelector(selectWorkflowAttachments);
  const detailLoading = useSelector(selectWorkflowDetailLoading);
  const uploadLoading = useSelector(selectWorkflowUploadLoading);
  const trackingLoading = useSelector(selectWorkflowTrackingLoading);

  // Status update state
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState<string>("");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState(false);

  // Upload state (single form or split forms)
  const [fileType, setFileType] = useState<string>("design_sample");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // Split upload state for Design queue
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [printFile, setPrintFile] = useState<File | null>(null);
  const [sampleUploading, setSampleUploading] = useState(false);
  const [printUploading, setPrintUploading] = useState(false);

  // Tracking state
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  useEffect(() => {
    if (!orderId) return;
    dispatch(fetchQueueOrderDetail({ queue, orderId }));
    dispatch(fetchOrderAudit({ queue, orderId }));
    dispatch(fetchOrderAttachments({ queue, orderId }));
    return () => {
      dispatch(workflowActions.clearOrderDetail());
    };
  }, [dispatch, queue, orderId]);

  useEffect(() => {
    if (order) {
      setTrackingNumber(order.tracking_number ?? "");
      setCourierName(order.courier_name ?? "");
      setTrackingUrl(order.tracking_url ?? "");
    }
  }, [order]);

  const allowedStatuses = ROLE_ALLOWED_STATUSES[user?.role ?? "CUSTOMER"] ?? [];

  const handleStatusUpdate = async () => {
    if (!orderId || !newStatus) return;
    setStatusUpdating(true);
    setStatusError(null);
    setStatusSuccess(false);
    try {
      await dispatch(updateOrderStatus({ id: orderId, status: newStatus })).unwrap();
      setStatusSuccess(true);
      // Refresh detail + audit
      dispatch(fetchQueueOrderDetail({ queue, orderId }));
      dispatch(fetchOrderAudit({ queue, orderId }));
      setNewStatus("");
      setStatusNote("");
      setTimeout(() => setStatusSuccess(false), 2500);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "Failed to update status";
      setStatusError(msg);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUpload = async () => {
    if (!orderId || !selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("file_type", fileType);
    try {
      await dispatch(uploadAttachment({ orderId, formData })).unwrap();
      setSelectedFile(null);
      dispatch(fetchOrderAttachments({ queue, orderId }));
    } catch {
      // error is set in slice
    }
  };

  const handleSplitUpload = async (file: File, type: "design_sample" | "print_ready", setUploading: (v: boolean) => void, clearFile: () => void) => {
    if (!orderId) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", type);
    try {
      await dispatch(uploadAttachment({ orderId, formData })).unwrap();
      clearFile();
      dispatch(fetchOrderAttachments({ queue, orderId }));
    } catch {
      // error is set in slice
    } finally {
      setUploading(false);
    }
  };

  const handleTrackingSave = async () => {
    if (!orderId) return;
    try {
      await dispatch(updateTracking({
        orderId,
        data: { tracking_number: trackingNumber, courier_name: courierName, tracking_url: trackingUrl },
      })).unwrap();
      dispatch(fetchOrderAudit({ queue, orderId }));
    } catch {
      // handled in slice
    }
  };

  if (detailLoading && !order) {
    return <div style={{ color: "#64748b" }}>Loading order…</div>;
  }
  if (!order) {
    return <div style={{ color: "#ef4444" }}>Order not found.</div>;
  }

  const currentStatusColor = STATUS_COLORS[order.status] ?? "#64748b";

  return (
    <div>
      <button
        onClick={() => navigate("..")}
        style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}
      >
        {backLabel}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", margin: 0 }}>
          #{order.order_number}
        </h1>
        <span style={{
          background: `${currentStatusColor}22`,
          color: currentStatusColor,
          padding: "6px 14px", borderRadius: 8,
          fontSize: 13, fontWeight: 600, letterSpacing: 0.3,
          textTransform: "capitalize",
        }}>
          {statusLabel(order.status)}
        </span>
      </div>

      {/* Summary grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <Panel title="Customer">
          <InfoRow label="Name" value={order.customer_name ?? "—"} />
          <InfoRow label="Email" value={order.customer_email ?? "—"} />
        </Panel>
        <Panel title="Totals">
          <InfoRow label="Subtotal" value={`₹${order.subtotal.toFixed(2)}`} />
          <InfoRow label="Tax" value={`₹${order.tax.toFixed(2)}`} />
          <InfoRow label="Shipping" value={`₹${order.shipping_cost.toFixed(2)}`} />
          <InfoRow label="Total" value={`₹${order.grand_total.toFixed(2)}`} bold />
          <InfoRow label="Cards" value={String(order.total_cards)} />
        </Panel>
      </div>

      {/* Shipping address */}
      <Panel title="Shipping Address" style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
          {order.shipping_address.first_name} {order.shipping_address.last_name}<br />
          {order.shipping_address.address1}<br />
          {order.shipping_address.address2 && <>{order.shipping_address.address2}<br /></>}
          {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}<br />
          {order.shipping_address.country}<br />
          {order.shipping_address.phone}
        </div>
      </Panel>

      {/* Items */}
      <Panel title={`Items (${order.items.length})`} style={{ marginBottom: 24 }}>
        {order.items.map((item, idx) => (
          <div key={item.id} style={{
            padding: "12px 0",
            borderBottom: idx < order.items.length - 1 ? "1px solid #1e293b" : "none",
            fontSize: 13,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#e2e8f0", fontWeight: 600, marginBottom: 6 }}>
              <span>{item.card_type} × {item.quantity}</span>
              <span>₹{item.total_price.toFixed(2)}</span>
            </div>
            <div style={{ color: "#64748b", fontSize: 12 }}>
              {item.printer} • {item.print_side} • {item.orientation} • {item.finish} • {item.chip_type} • {item.material}
            </div>
          </div>
        ))}
      </Panel>

      {/* Status update panel */}
      {allowedStatuses.length > 0 && (
        <Panel title="Update Status" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                padding: "8px 12px", background: "#0b0f1a", color: "#e2e8f0",
                border: "1px solid #1e293b", borderRadius: 6, fontSize: 13, minWidth: 180,
              }}
            >
              <option value="">Select new status…</option>
              {allowedStatuses.filter(s => s !== order.status).map(s => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Optional note"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              style={{
                padding: "8px 12px", background: "#0b0f1a", color: "#e2e8f0",
                border: "1px solid #1e293b", borderRadius: 6, fontSize: 13, flex: 1, minWidth: 200,
              }}
            />
            <button
              onClick={handleStatusUpdate}
              disabled={!newStatus || statusUpdating}
              style={{
                padding: "8px 20px",
                background: !newStatus || statusUpdating ? "#1e293b" : "#e05c1a",
                color: !newStatus || statusUpdating ? "#64748b" : "#fff",
                border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
                cursor: !newStatus || statusUpdating ? "not-allowed" : "pointer",
              }}
            >
              {statusUpdating ? "Updating…" : "Update"}
            </button>
          </div>
          {statusError && <div style={{ color: "#f87171", fontSize: 12, marginTop: 8 }}>{statusError}</div>}
          {statusSuccess && <div style={{ color: "#22c55e", fontSize: 12, marginTop: 8 }}>Status updated.</div>}
        </Panel>
      )}

      {/* Tracking panel */}
      {showTrackingPanel && (
        <Panel title="Tracking Info" style={{ marginBottom: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <LabeledInput label="Tracking Number" value={trackingNumber} onChange={setTrackingNumber} />
            <LabeledInput label="Courier" value={courierName} onChange={setCourierName} />
          </div>
          <LabeledInput label="Tracking URL" value={trackingUrl} onChange={setTrackingUrl} />
          <button
            onClick={handleTrackingSave}
            disabled={trackingLoading}
            style={{
              marginTop: 12, padding: "8px 20px",
              background: trackingLoading ? "#1e293b" : "#e05c1a",
              color: trackingLoading ? "#64748b" : "#fff",
              border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600,
              cursor: trackingLoading ? "not-allowed" : "pointer",
            }}
          >
            {trackingLoading ? "Saving…" : "Save Tracking"}
          </button>
        </Panel>
      )}

      {/* Customer design previews from canvas */}
      {order.items.some(item => item.thumbnail_url) && (
        <Panel title="Customer Design Files" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {order.items.filter(item => item.thumbnail_url).map((item, idx) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: 12, background: "#0b0f1a", borderRadius: 8 }}>
                <img
                  src={`${API_BASE}${item.thumbnail_url}`}
                  alt={`Design ${idx + 1}`}
                  style={{ width: 80, height: 50, objectFit: "cover", borderRadius: 6, border: "1px solid #1e293b", background: "#141824" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>
                    {item.card_type} × {item.quantity}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                    {item.printer} • {item.print_side} • {item.orientation} • {item.finish}
                  </div>
                </div>
                <a
                  href={`${API_BASE}${item.thumbnail_url}`}
                  download={`design-${idx + 1}.png`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: "6px 14px", background: "#1e293b", color: "#94a3b8", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap" }}
                >
                  ⬇ Download Preview
                </a>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Attachments */}
      <Panel title={`Attachments (${attachments.length})`} style={{ marginBottom: 24 }}>
        {attachments.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>No attachments yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {attachments.map((a) => (
              <div key={a.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 10, background: "#0b0f1a", borderRadius: 6, fontSize: 13,
              }}>
                <div>
                  <a
                    href={`${API_BASE}${a.file_url}`}
                    download={a.file_name}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#e05c1a", textDecoration: "none", fontWeight: 600 }}
                  >
                    ⬇ {a.file_name}
                  </a>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                    {a.file_type.replace("_", " ")}
                    {a.created_at && ` • ${new Date(a.created_at).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showAttachmentUpload && !splitUploadForms && (
          <div style={{ marginTop: 16, padding: 16, background: "#0b0f1a", border: "1px dashed #1e293b", borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10, fontWeight: 600 }}>Upload new attachment</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                style={{
                  padding: "6px 10px", background: "#0f1623", color: "#e2e8f0",
                  border: "1px solid #1e293b", borderRadius: 6, fontSize: 12,
                }}
              >
                <option value="design_sample">Design Sample</option>
                <option value="print_ready">Print Ready</option>
                <option value="reference">Reference</option>
              </select>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                style={{ fontSize: 12, color: "#94a3b8", flex: 1, minWidth: 200 }}
              />
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploadLoading}
                style={{
                  padding: "6px 16px",
                  background: !selectedFile || uploadLoading ? "#1e293b" : "#e05c1a",
                  color: !selectedFile || uploadLoading ? "#64748b" : "#fff",
                  border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: !selectedFile || uploadLoading ? "not-allowed" : "pointer",
                }}
              >
                {uploadLoading ? "Uploading…" : "Upload"}
              </button>
            </div>
          </div>
        )}

        {splitUploadForms && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Upload Sample for Review */}
            <div style={{ padding: 16, background: "#0b0f1a", border: "1px dashed #1e3a5f", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#3b82f6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Upload Sample for Review
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
                Upload a design preview for the customer or team to review (JPG, PNG, WebP, PDF).
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)}
                  style={{ fontSize: 12, color: "#94a3b8", flex: 1, minWidth: 200 }}
                />
                <button
                  onClick={() => sampleFile && handleSplitUpload(sampleFile, "design_sample", setSampleUploading, () => setSampleFile(null))}
                  disabled={!sampleFile || sampleUploading}
                  style={{
                    padding: "6px 16px",
                    background: !sampleFile || sampleUploading ? "#1e293b" : "#3b82f6",
                    color: !sampleFile || sampleUploading ? "#64748b" : "#fff",
                    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: !sampleFile || sampleUploading ? "not-allowed" : "pointer",
                  }}
                >
                  {sampleUploading ? "Uploading…" : "Upload Sample"}
                </button>
              </div>
            </div>

            {/* Upload Print-Ready File */}
            <div style={{ padding: 16, background: "#0b0f1a", border: "1px dashed #6d28d9", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#8b5cf6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Upload Print-Ready File
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
                Upload the final file ready for the printing team (PDF preferred, JPG/PNG also accepted).
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPrintFile(e.target.files?.[0] ?? null)}
                  style={{ fontSize: 12, color: "#94a3b8", flex: 1, minWidth: 200 }}
                />
                <button
                  onClick={() => printFile && handleSplitUpload(printFile, "print_ready", setPrintUploading, () => setPrintFile(null))}
                  disabled={!printFile || printUploading}
                  style={{
                    padding: "6px 16px",
                    background: !printFile || printUploading ? "#1e293b" : "#8b5cf6",
                    color: !printFile || printUploading ? "#64748b" : "#fff",
                    border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600,
                    cursor: !printFile || printUploading ? "not-allowed" : "pointer",
                  }}
                >
                  {printUploading ? "Uploading…" : "Upload Print File"}
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>

      {/* Audit log */}
      <Panel title={`Audit Log (${auditLogs.length})`}>
        {auditLogs.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: 13 }}>No audit entries yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ display: "flex", gap: 12, padding: 10, background: "#0b0f1a", borderRadius: 6, fontSize: 12 }}>
                <div style={{ width: 120, color: "#64748b", flexShrink: 0 }}>
                  {log.changed_at ? new Date(log.changed_at).toLocaleString() : "—"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "#e2e8f0" }}>
                    {log.old_status && (
                      <>
                        <span style={{ color: "#64748b" }}>{statusLabel(log.old_status)}</span>
                        <span style={{ color: "#64748b", margin: "0 6px" }}>→</span>
                      </>
                    )}
                    <span style={{ color: STATUS_COLORS[log.new_status] ?? "#e2e8f0", fontWeight: 600 }}>
                      {statusLabel(log.new_status)}
                    </span>
                  </div>
                  {log.note && <div style={{ color: "#94a3b8", marginTop: 2 }}>{log.note}</div>}
                  {log.changed_by_role && <div style={{ color: "#64748b", marginTop: 2, fontSize: 11 }}>by {log.changed_by_role}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function Panel({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#0f1623", border: "1px solid #1e293b", borderRadius: 12, padding: 20, ...style }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <span style={{ color: bold ? "#e05c1a" : "#e2e8f0", fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 4, fontWeight: 600 }}>{label}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "8px 12px", background: "#0b0f1a", color: "#e2e8f0",
          border: "1px solid #1e293b", borderRadius: 6, fontSize: 13, boxSizing: "border-box",
        }}
      />
    </div>
  );
}
