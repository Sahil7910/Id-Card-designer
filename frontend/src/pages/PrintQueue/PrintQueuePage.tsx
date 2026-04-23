import QueueList from "../Queue/QueueList";

export default function PrintQueuePage() {
  return (
    <QueueList
      queue="print-queue"
      title="Print Queue"
      emptyMessage="No orders currently printing."
    />
  );
}
