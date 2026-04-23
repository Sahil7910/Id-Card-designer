import QueueList from "../Queue/QueueList";

export default function DesignQueuePage() {
  return (
    <QueueList
      queue="design-queue"
      title="Design Queue"
      emptyMessage="No orders waiting for design work."
    />
  );
}
