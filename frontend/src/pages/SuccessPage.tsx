import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { assetUrl } from "../config";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";

export function SuccessPage() {
  const navigate = useNavigate();
  const confirmation = useBookingStore((state) => state.confirmation);
  const resetAll = useBookingStore((state) => state.resetAll);

  useEffect(() => {
    if (!confirmation) {
      navigate("/", { replace: true });
    }
  }, [confirmation, navigate]);

  return (
    <div className="page">
      <header className="page-header page-header-logo-only">
        <img src={assetUrl("/assets/images/forrest-logo.png")} alt="Forrest Glamp" className="page-header-logo" />
      </header>

      <BookingStepper currentStep={4} />

      <main className="card success-card">
        <h2>Reference: {confirmation?.bookingReference ?? "Pending"}</h2>
        <p>Status: {confirmation?.status ?? "-"}</p>
        <p>Created: {confirmation?.createdAt ?? "-"}</p>
        {confirmation?.paymentMethod === "invoice" ? (
          <p className="success-note">
            You selected invoice payment. We will issue the invoice after reservation and confirm the booking once funds arrive (usually within 1-2 days). For urgent stays, use Card or PayPal.
          </p>
        ) : null}
        {confirmation?.paymentMethod !== "invoice" && confirmation?.paymentRequired ? (
          <div className="success-payment">
            <p className="success-note">Your booking is waiting for payment completion.</p>
            {confirmation.paymentUrl ? (
              <a className="button secondary" href={confirmation.paymentUrl} target="_blank" rel="noreferrer">
                Pay now
              </a>
            ) : (
              <p className="muted">Payment link is not available yet. Please open the reservation link in Smoobu or contact support.</p>
            )}
          </div>
        ) : null}
        <div className="actions">
          <button
            type="button"
            className="button primary"
            onClick={() => {
              resetAll();
              navigate("/");
            }}
          >
            Start a new booking
          </button>
        </div>
      </main>
    </div>
  );
}


