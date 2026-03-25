import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient, ApiClientError } from "../api/client";
import { PriceSummary } from "../components/PriceSummary/PriceSummary";
import { RateCard } from "../components/RateCard/RateCard";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";

export function UnitPage() {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const unitId = params.id ?? "";

  const availability = useBookingStore((state) => state.availability);
  const search = useBookingStore((state) => state.search);
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectUnit = useBookingStore((state) => state.selectUnit);
  const ratesByUnit = useBookingStore((state) => state.ratesByUnit);
  const setUnitRates = useBookingStore((state) => state.setUnitRates);
  const selectedRateId = useBookingStore((state) => state.selectedRateId);
  const setSelectedRateId = useBookingStore((state) => state.setSelectedRateId);
  const setErrorMessage = useBookingStore((state) => state.setErrorMessage);
  const errorMessage = useBookingStore((state) => state.errorMessage);

  const [loading, setLoading] = useState(false);
  const unitRates = ratesByUnit[unitId];

  useEffect(() => {
    if (!availability) {
      navigate("/", { replace: true });
      return;
    }

    const matchedUnit = availability.units.find((unit) => unit.id === unitId) ?? null;
    if (!matchedUnit) {
      navigate("/results", { replace: true });
      return;
    }

    if (!selectedUnit || selectedUnit.id !== matchedUnit.id) {
      selectUnit(matchedUnit);
    }
  }, [availability, navigate, selectUnit, selectedUnit, unitId]);

  useEffect(() => {
    let mounted = true;
    const fetchRates = async (): Promise<void> => {
      if (!unitId || unitRates) {
        return;
      }

      setLoading(true);
      setErrorMessage("");
      try {
        const rates = await apiClient.getUnitRates(unitId, search);
        if (mounted) {
          setUnitRates(unitId, rates);
        }
      } catch (error) {
        if (mounted) {
          if (error instanceof ApiClientError) {
            setErrorMessage(error.error.message);
          } else {
            setErrorMessage("Could not load rates for this unit.");
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchRates();
    return () => {
      mounted = false;
    };
  }, [search, setErrorMessage, setUnitRates, unitId, unitRates]);

  const selectedRate = useMemo(
    () => unitRates?.rates.find((rate) => rate.id === selectedRateId) ?? null,
    [selectedRateId, unitRates?.rates],
  );

  const handleContinue = (): void => {
    if (!selectedRateId) {
      setErrorMessage("Select a rate plan to continue.");
      return;
    }

    setErrorMessage("");
    navigate("/guest");
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>{selectedUnit?.name ?? "Select your unit"}</h1>
        <p>Choose your preferred rate and cancellation conditions.</p>
      </header>

      <BookingStepper currentStep={3} />

      <div className="page-layout">
        <main className="card card-list">
          {loading ? <p className="muted">Loading rates...</p> : null}
          {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

          {unitRates?.rates.map((rate) => (
            <RateCard key={rate.id} rate={rate} isSelected={rate.id === selectedRateId} onSelect={setSelectedRateId} />
          ))}

          {selectedRate ? (
            <div className="actions">
              <button type="button" className="button primary" onClick={handleContinue}>
                Continue with {selectedRate.name}
              </button>
            </div>
          ) : null}
        </main>

        <PriceSummary />
      </div>
    </div>
  );
}


