import QueueList from "../Queue/QueueList";

export default function ShippingQueuePage() {
  return (
    <QueueList
      queue="shipping-queue"
      title="Shipping Queue"
      emptyMessage="No orders waiting to ship."
    />
  );
}
