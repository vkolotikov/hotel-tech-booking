import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PriceSummary } from "../components/PriceSummary/PriceSummary";
import { RoomCard } from "../components/RoomCard/RoomCard";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";
import type { AvailabilityUnit } from "../types/api";

export function ResultsPage() {
  const navigate = useNavigate();
  const availability = useBookingStore((state) => state.availability);
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectUnit = useBookingStore((state) => state.selectUnit);
  const setErrorMessage = useBookingStore((state) => state.setErrorMessage);

  useEffect(() => {
    if (!availability) {
      navigate("/", { replace: true });
    }
  }, [availability, navigate]);

  const handleSelect = (unit: AvailabilityUnit): void => {
    selectUnit(unit);
    setErrorMessage("");
    navigate(`/unit/${unit.id}`);
  };

  const handleViewDetails = (unit: AvailabilityUnit): void => {
    selectUnit(unit);
    navigate(`/unit/${unit.id}`);
  };

  return (
    <div className="page">
      <header className="page-header">
        <h1>Rooms available</h1>
        <p>Pick the stay that matches your pace and comfort.</p>
      </header>

      <BookingStepper currentStep={2} />

      <div className="page-layout">
        <main className="card card-list">
          {availability?.units.length ? (
            availability.units.map((unit) => (
              <RoomCard
                key={unit.id}
                unit={unit}
                isSelected={selectedUnit?.id === unit.id}
                onSelect={handleSelect}
                onViewDetails={handleViewDetails}
              />
            ))
          ) : (
            <p className="muted">No rooms match your criteria. Try different dates.</p>
          )}
        </main>

        <PriceSummary />
      </div>
    </div>
  );
}


