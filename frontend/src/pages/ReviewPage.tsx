import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { apiClient, ApiClientError } from "../api/client";
import { assetUrl } from "../config";
import { PriceSummary } from "../components/PriceSummary/PriceSummary";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";
import type { GuestDetails, PaymentMethod } from "../types/api";

function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const guestSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Valid email is required."),
  phone: z.string().min(6, "Phone number is required."),
});

export function ReviewPage() {
  const navigate = useNavigate();
  const config = useBookingStore((state) => state.config);
  const search = useBookingStore((state) => state.search);
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectedRateId = useBookingStore((state) => state.selectedRateId);
  const extras = useBookingStore((state) => state.extras);
  const guest = useBookingStore((state) => state.guest);
  const billing = useBookingStore((state) => state.billing);
  const notes = useBookingStore((state) => state.notes);
  const consents = useBookingStore((state) => state.consents);
  const setConsents = useBookingStore((state) => state.setConsents);
  const setGuest = useBookingStore((state) => state.setGuest);
  const setBilling = useBookingStore((state) => state.setBilling);
  const setNotes = useBookingStore((state) => state.setNotes);
  const quote = useBookingStore((state) => state.quote);
  const setQuote = useBookingStore((state) => state.setQuote);
  const setConfirmation = useBookingStore((state) => state.setConfirmation);

  const [guestForm, setGuestForm] = useState<Pick<GuestDetails, "firstName" | "lastName" | "email" | "phone">>({
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
  });
  const [localNotes, setLocalNotes] = useState(notes);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedUnit || !selectedRateId) {
      navigate("/", { replace: true });
      return;
    }

    let mounted = true;
    const refreshQuote = async (): Promise<void> => {
      setLoadingQuote(true);
      setError("");
      try {
        const nextQuote = await apiClient.quote({
          unitId: selectedUnit.id,
          dates: { checkIn: search.checkIn, checkOut: search.checkOut },
          guests: { adults: search.adults, children: search.children },
          rateId: selectedRateId,
          extras,
        });
        if (mounted) {
          setQuote(nextQuote);
        }
      } catch (requestError) {
        if (mounted) {
          if (requestError instanceof ApiClientError) {
            setError(requestError.error.message);
          } else {
            setError("Could not build final quote. Please retry.");
          }
        }
      } finally {
        if (mounted) {
          setLoadingQuote(false);
        }
      }
    };

    void refreshQuote();
    return () => {
      mounted = false;
    };
  }, [
    extras,
    navigate,
    search.adults,
    search.checkIn,
    search.checkOut,
    search.children,
    selectedRateId,
    selectedUnit,
    setQuote,
  ]);

  const handleConfirm = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const guestResult = guestSchema.safeParse(guestForm);

    if (!guestResult.success) {
      setError(guestResult.error.issues[0]?.message ?? "Guest details are invalid.");
      return;
    }

    if (!quote) {
      setError("Quote is still loading.");
      return;
    }

    if (!consents.termsAccepted || !consents.privacyAccepted) {
      setError("You must accept terms and privacy policy before confirming.");
      return;
    }

    setConfirming(true);
    setError("");

    try {
      const nextGuest: GuestDetails = {
        title: guest.title || "Guest",
        nationality: guest.nationality || "Latvia",
        ...guestResult.data,
      };
      const nextBilling = {
        address: billing.address || "Not provided",
        zipCode: billing.zipCode || "N/A",
        city: billing.city || "Not provided",
        country: billing.country || "Latvia",
      };
      const nextNotes = localNotes.trim();

      setGuest(nextGuest);
      setBilling(nextBilling);
      setNotes(nextNotes);

      const confirmation = await apiClient.confirm(
        {
          holdToken: quote.holdToken,
          quote: quote.quoteSnapshot,
          guest: nextGuest,
          billing: nextBilling,
          notes: nextNotes,
          consents: {
            termsAccepted: consents.termsAccepted,
            privacyAccepted: consents.privacyAccepted,
            version: config?.policies.termsVersion ?? "2026-02-20",
          },
          paymentMethod,
        },
        createIdempotencyKey(),
      );

      setConfirmation(confirmation);
      navigate("/success");
    } catch (requestError) {
      if (requestError instanceof ApiClientError) {
        setError(requestError.error.message);
      } else {
        setError("Could not confirm booking. Please try again.");
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header page-header-logo-only">
        <img src={assetUrl("/assets/images/forrest-logo.png")} alt="Forrest Glamp" className="page-header-logo" />
      </header>

      <BookingStepper currentStep={4} />

      <div className="page-layout">
        <main className="card">
          {loadingQuote ? <p className="muted">Refreshing quote...</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}

          <form id="booking-confirm-form" className="grid-form" onSubmit={handleConfirm}>
            <h2 className="field-full">Guest details</h2>
            <label>
              First name
              <input
                value={guestForm.firstName}
                onChange={(event) => setGuestForm((state) => ({ ...state, firstName: event.target.value }))}
              />
            </label>

            <label>
              Last name
              <input value={guestForm.lastName} onChange={(event) => setGuestForm((state) => ({ ...state, lastName: event.target.value }))} />
            </label>

            <label>
              Email
              <input type="email" value={guestForm.email} onChange={(event) => setGuestForm((state) => ({ ...state, email: event.target.value }))} />
            </label>

            <label>
              Phone
              <input value={guestForm.phone} onChange={(event) => setGuestForm((state) => ({ ...state, phone: event.target.value }))} />
            </label>

            <h2 className="field-full">Payment details</h2>
            <section className="review-section field-full">
              <div className="payment-methods" role="radiogroup" aria-label="Payment method">
                <label className={`payment-option ${paymentMethod === "card" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                  />
                  <span>Card</span>
                </label>

                <label className={`payment-option ${paymentMethod === "paypal" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="paypal"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  <span>PayPal</span>
                </label>

                <label className={`payment-option ${paymentMethod === "invoice" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="invoice"
                    checked={paymentMethod === "invoice"}
                    onChange={() => setPaymentMethod("invoice")}
                  />
                  <span>Invoice</span>
                </label>
              </div>
              <p className="muted payment-note">
                {paymentMethod === "invoice"
                  ? "Invoice is issued after reservation. Booking is confirmed after payment arrives (typically 1-2 days). For urgent stays, use Card or PayPal."
                  : "After reservation, you will continue to secure online payment."}
              </p>
            </section>

            <label className="field-full">
              Notes (optional)
              <textarea value={localNotes} onChange={(event) => setLocalNotes(event.target.value)} rows={3} />
            </label>

            <label className="consent compact single-consent field-full">
              <input
                type="checkbox"
                checked={consents.termsAccepted && consents.privacyAccepted}
                onChange={(event) =>
                  setConsents({
                    termsAccepted: event.target.checked,
                    privacyAccepted: event.target.checked,
                  })
                }
              />
              <span>I accept booking terms and privacy policy.</span>
            </label>

            <div className="actions field-full">
              <button type="submit" className="button primary" disabled={confirming || loadingQuote}>
                {confirming ? "Confirming..." : "Confirm booking"}
              </button>
            </div>
          </form>
        </main>

        <PriceSummary
          actionLabel={confirming ? "Confirming..." : "Confirm booking"}
          actionDisabled={confirming || loadingQuote}
          actionType="submit"
          actionFormId="booking-confirm-form"
        />
      </div>
    </div>
  );
}
