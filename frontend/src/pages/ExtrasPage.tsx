import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PriceSummary } from "../components/PriceSummary/PriceSummary";
import { BookingStepper } from "../components/Stepper/BookingStepper";
import { useBookingStore } from "../store/bookingStore";
import { assetUrl } from "../config";

const extraImageByCode: Record<string, string> = {
  private_sauna_one: "sauna-rituals.jpg",
  private_sauna_two: "couple-sauna-rituals.jpg",
  group_sauna: "group-sauna.jpg",
  relaxing_massage: "massage.jpg",
  breakfast_basket: "food-service.jpg",
  rose_bouquet_30: "roses.jpg",
  sweet_selection_brut: "saldumu-plate.jpg",
  cheese_board_riesling: "siera-plate.jpg",
  private_jacuzzi_access: "jacuzzi.jpg",
};

function pricingChipLabel(model: "per_stay" | "per_day" | "per_guest"): string {
  if (model === "per_day") return "Per day";
  if (model === "per_guest") return "Per guest";
  return "Per stay";
}

export function ExtrasPage() {
  const navigate = useNavigate();
  const config = useBookingStore((state) => state.config);
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectedRateId = useBookingStore((state) => state.selectedRateId);
  const extras = useBookingStore((state) => state.extras);
  const toggleExtra = useBookingStore((state) => state.toggleExtra);

  useEffect(() => {
    if (!selectedUnit || !selectedRateId) {
      navigate("/", { replace: true });
    }
  }, [navigate, selectedRateId, selectedUnit]);

  return (
    <div className="page">
      <header className="page-header page-header-logo-only">
        <img src={assetUrl("/assets/images/forrest-logo.png")} alt="Forrest Glamp" className="page-header-logo" />
      </header>

      <BookingStepper currentStep={3} />

      <div className="page-layout">
        <main className="card card-list">
          {config?.extras.map((extra) => {
            const selected = extras.includes(extra.code);
            const image = assetUrl(`/assets/images/${extraImageByCode[extra.code] ?? "sauna.jpg"}`);

            return (
              <label key={extra.code} className={`extra-card ${selected ? "selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggleExtra(extra.code)}
                />
                <img src={image} alt={extra.name} className="extra-image" />
                <div className="extra-content">
                  <h3>{extra.name}</h3>
                  <p>{extra.description}</p>
                  {extra.details ? <p className="extra-details">{extra.details}</p> : null}
                  <span className="extra-chip">{pricingChipLabel(extra.pricingModel)}</span>
                </div>
                <div className="extra-side">
                  <strong className="extra-price">EUR {extra.priceGross.toFixed(2)}</strong>
                  <span className={`extra-select-tag ${selected ? "active" : ""}`}>{selected ? "Added" : "Add service"}</span>
                </div>
              </label>
            );
          })}

          <div className="actions">
            <button type="button" className="button primary" onClick={() => navigate("/review")}>
              Continue to reservation
            </button>
          </div>
        </main>

        <PriceSummary actionLabel="Continue reservation" onAction={() => navigate("/review")} />
      </div>
    </div>
  );
}


