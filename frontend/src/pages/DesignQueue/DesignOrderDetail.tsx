import QueueOrderDetail from "../Queue/QueueOrderDetail";

export default function DesignOrderDetail() {
  return (
    <QueueOrderDetail
      queue="design-queue"
      showAttachmentUpload
      splitUploadForms
    />
  );
}
