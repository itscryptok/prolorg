import Link from "next/link";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { unlockFeeLabel } from "@/lib/unlock";

export const metadata = { title: "Payment successful — AiProlice" };

// Shown after Stripe Checkout completes for a $1.50 contact unlock.
// Verifies the session server-side with Stripe before confirming.
export default async function UnlockSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  let paid = false;
  let conversationId: string | null = null;

  if (session_id && stripeConfigured()) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(session_id);
      paid = session.payment_status === "paid";
      conversationId = (session.metadata?.conversationId as string | undefined) ?? null;
    } catch {
      paid = false;
    }
  }

  return (
    <main className="container section">
      <div className="auth-card" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
        {paid ? (
          <>
            <h1>You're unlocked</h1>
            <p>
              Payment of {unlockFeeLabel()} received. You and your AI pro can
              now share direct contact details in your chat.
            </p>
            {conversationId && (
              <Link className="btn btn-orange" href={`/inbox/${conversationId}`}>
                Back to your chat
              </Link>
            )}
          </>
        ) : (
          <>
            <h1>Payment not confirmed</h1>
            <p>
              We couldn't confirm a completed payment for this session. If you
              were charged, the unlock is applied automatically — check your
              inbox. Otherwise, try again from the chat.
            </p>
            <Link className="btn btn-outline" href="/activity">
              Go to your inbox
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
