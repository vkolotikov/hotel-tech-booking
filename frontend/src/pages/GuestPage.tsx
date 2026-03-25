import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { PriceSummary } from "../components/PriceSummary/PriceSummary";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";
import type { BillingDetails, GuestDetails } from "../types/api";

const guestSchema = z.object({
  title: z.string().min(1, "Title is required."),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Valid email is required."),
  phone: z.string().min(6, "Phone number is required."),
  nationality: z.string().min(1, "Nationality is required."),
});

const billingSchema = z.object({
  address: z.string().min(1, "Billing address is required."),
  zipCode: z.string().min(1, "ZIP code is required."),
  city: z.string().min(1, "City is required."),
  country: z.string().min(1, "Country is required."),
});

export function GuestPage() {
  const navigate = useNavigate();
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectedRateId = useBookingStore((state) => state.selectedRateId);
  const guest = useBookingStore((state) => state.guest);
  const billing = useBookingStore((state) => state.billing);
  const notes = useBookingStore((state) => state.notes);
  const setGuest = useBookingStore((state) => state.setGuest);
  const setBilling = useBookingStore((state) => state.setBilling);
  const setNotes = useBookingStore((state) => state.setNotes);

  const [guestForm, setGuestForm] = useState<GuestDetails>(guest);
  const [billingForm, setBillingForm] = useState<BillingDetails>(billing);
  const [localNotes, setLocalNotes] = useState(notes);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedUnit || !selectedRateId) {
      navigate("/results", { replace: true });
    }
  }, [navigate, selectedRateId, selectedUnit]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const guestResult = guestSchema.safeParse(guestForm);
    const billingResult = billingSchema.safeParse(billingForm);

    if (!guestResult.success) {
      setError(guestResult.error.issues[0]?.message ?? "Guest details are invalid.");
      return;
    }

    if (!billingResult.success) {
      setError(billingResult.error.issues[0]?.message ?? "Billing details are invalid.");
      return;
    }

    setGuest(guestResult.data);
    setBilling(billingResult.data);
    setNotes(localNotes.trim());
    setError("");
    navigate("/extras");
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Guest details</h1>
        <p>Tell us who is staying and where to send your confirmation.</p>
      </header>

      <BookingStepper currentStep={4} />

      <div className="page-layout">
        <main className="card">
          <form className="grid-form" onSubmit={handleSubmit}>
            <h2>Let's get acquainted</h2>
            <label>
              Title
              <select value={guestForm.title} onChange={(event) => setGuestForm((state) => ({ ...state, title: event.target.value }))}>
                <option value="">Choose</option>
                <option value="Mr">Mr</option>
                <option value="Ms">Ms</option>
                <option value="Mrs">Mrs</option>
                <option value="Mx">Mx</option>
              </select>
            </label>

            <label>
              First name
              <input
                value={guestForm.firstName}
                onChange={(event) => setGuestForm((state) => ({ ...state, firstName: event.target.value }))}
              />
            </label>

            <label>
              Last name
              <input
                value={guestForm.lastName}
                onChange={(event) => setGuestForm((state) => ({ ...state, lastName: event.target.value }))}
              />
            </label>

            <label>
              Nationality
              <input
                value={guestForm.nationality}
                onChange={(event) => setGuestForm((state) => ({ ...state, nationality: event.target.value }))}
              />
            </label>

            <label className="field-full">
              Email
              <input
                type="email"
                value={guestForm.email}
                onChange={(event) => setGuestForm((state) => ({ ...state, email: event.target.value }))}
              />
            </label>

            <label className="field-full">
              Phone
              <input
                value={guestForm.phone}
                onChange={(event) => setGuestForm((state) => ({ ...state, phone: event.target.value }))}
              />
            </label>

            <h2>Billing address</h2>

            <label className="field-full">
              Address
              <input
                value={billingForm.address}
                onChange={(event) => setBillingForm((state) => ({ ...state, address: event.target.value }))}
              />
            </label>

            <label>
              ZIP code
              <input
                value={billingForm.zipCode}
                onChange={(event) => setBillingForm((state) => ({ ...state, zipCode: event.target.value }))}
              />
            </label>

            <label>
              City
              <input
                value={billingForm.city}
                onChange={(event) => setBillingForm((state) => ({ ...state, city: event.target.value }))}
              />
            </label>

            <label className="field-full">
              Country
              <input
                value={billingForm.country}
                onChange={(event) => setBillingForm((state) => ({ ...state, country: event.target.value }))}
              />
            </label>

            <label className="field-full">
              Notes (optional)
              <textarea value={localNotes} onChange={(event) => setLocalNotes(event.target.value)} rows={3} />
            </label>

            {error ? <p className="error-banner">{error}</p> : null}

            <div className="actions field-full">
              <button type="submit" className="button primary">
                Continue to extras
              </button>
            </div>
          </form>
        </main>

        <PriceSummary />
      </div>
    </div>
  );
}

