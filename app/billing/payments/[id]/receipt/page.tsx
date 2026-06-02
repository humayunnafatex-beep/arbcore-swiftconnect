import { BillingReceiptPage } from "@/components/billing-receipt-page";

export default function PaymentReceiptPage({ params }: { params: { id: string } }) {
  return <BillingReceiptPage paymentId={params.id} />;
}
