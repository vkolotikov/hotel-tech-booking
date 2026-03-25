import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, ApiClientError } from "../api/client";
import { assetUrl } from "../config";
import { PriceSummary } from "../components/PriceSummary/PriceSummary";
import { RoomCard } from "../components/RoomCard/RoomCard";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";
import type { AvailabilityUnit, SearchCriteria } from "../types/api";

export function SearchPage() {
  const navigate = useNavigate();
  const setConfig = useBookingStore((state) => state.setConfig);
  const search = useBookingStore((state) => state.search);
  const setSearch = useBookingStore((state) => state.setSearch);
  const setAvailability = useBookingStore((state) => state.setAvailability);
  const availability = useBookingStore((state) => state.availability);
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectUnit = useBookingStore((state) => state.selectUnit);
  const ratesByUnit = useBookingStore((state) => state.ratesByUnit);
  const setUnitRates = useBookingStore((state) => state.setUnitRates);
  const setSelectedRateId = useBookingStore((state) => state.setSelectedRateId);
  const resetAfterSearch = useBookingStore((state) => state.resetAfterSearch);
  const setErrorMessage = useBookingStore((state) => state.setErrorMessage);
  const errorMessage = useBookingStore((state) => state.errorMessage);

  const [form, setForm] = useState<SearchCriteria>(search);
  const [loading, setLoading] = useState(false);
  const [selectingUnitId, setSelectingUnitId] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadConfig = async (): Promise<void> => {
      try {
        const config = await apiClient.getConfig();
        if (mounted) {
          setConfig(config);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage("Could not load booking configuration. Please refresh.");
        }
      }
    };

    void loadConfig();
    return () => {
      mounted = false;
    };
  }, [setConfig, setErrorMessage]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      resetAfterSearch();
      setSearch(form);
      const availability = await apiClient.getAvailability(form);
      setAvailability(availability);
      setHasSearched(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.error.message);
      } else {
        setErrorMessage("Unexpected search error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = async (unit: AvailabilityUnit): Promise<void> => {
    setSelectingUnitId(unit.id);
    setErrorMessage("");
    selectUnit(unit);

    try {
      let rates = ratesByUnit[unit.id];
      if (!rates) {
        rates = await apiClient.getUnitRates(unit.id, search);
        setUnitRates(unit.id, rates);
      }

      const defaultRate = rates.rates[0];
      if (!defaultRate) {
        setErrorMessage("No rate plans are available for this room.");
        return;
      }

      setSelectedRateId(defaultRate.id);
      navigate("/extras");
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.error.message);
      } else {
        setErrorMessage("Could not prepare this room. Please try another one.");
      }
    } finally {
      setSelectingUnitId(null);
    }
  };

  return (
    <div className="page">
      <header className="page-header page-header-logo-only">
        <img src={assetUrl("/assets/images/forrest-logo.png")} alt="Forrest Glamp" className="page-header-logo" />
      </header>

      <BookingStepper currentStep={1} />

      <div className="page-layout">
        <main className="card">
          <h2>Search</h2>
          <form onSubmit={handleSubmit} className="grid-form">
            <label>
              Check-in
              <input
                type="date"
                required
                value={form.checkIn}
                onChange={(event) => setForm((state) => ({ ...state, checkIn: event.target.value }))}
              />
            </label>

            <label>
              Check-out
              <input
                type="date"
                required
                value={form.checkOut}
                onChange={(event) => setForm((state) => ({ ...state, checkOut: event.target.value }))}
              />
            </label>

            <label>
              Adults
              <input
                type="number"
                min={1}
                max={12}
                value={form.adults}
                onChange={(event) => setForm((state) => ({ ...state, adults: Number(event.target.value) }))}
              />
            </label>

            <label>
              Children
              <input
                type="number"
                min={0}
                max={12}
                value={form.children}
                onChange={(event) => setForm((state) => ({ ...state, children: Number(event.target.value) }))}
              />
            </label>

            <label className="field-full">
              Promo code
              <input
                type="text"
                value={form.promoCode ?? ""}
                onChange={(event) => setForm((state) => ({ ...state, promoCode: event.target.value }))}
                placeholder="Optional"
              />
            </label>

            {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

            <div className="actions field-full">
              <button type="submit" className="button primary" disabled={loading}>
                {loading ? "Searching..." : "Search rooms"}
              </button>
            </div>
          </form>

          {hasSearched && availability ? (
            <section className="search-results-inline">
              <div className="search-results-inline-header">
                <h3>Available rooms</h3>
                <p>{availability.units.length} options for your selected dates</p>
              </div>

              {availability.units.length > 0 ? (
                <div className="card-list">
                  {availability.units.map((unit) => (
                    <RoomCard
                      key={unit.id}
                      unit={unit}
                      isSelected={selectedUnit?.id === unit.id}
                      isSelecting={selectingUnitId === unit.id}
                      onSelect={(selected) => {
                        void handleSelectRoom(selected);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <p className="muted">No rooms match your criteria. Try different dates.</p>
              )}
            </section>
          ) : null}
        </main>

        <PriceSummary />
      </div>
    </div>
  );
}


