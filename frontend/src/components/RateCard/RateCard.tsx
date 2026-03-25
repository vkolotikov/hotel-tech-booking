import type { RatePlan } from "../../types/api";

interface RateCardProps {
  rate: RatePlan;
  isSelected: boolean;
  onSelect: (rateId: string) => void;
}

export function RateCard({ rate, isSelected, onSelect }: RateCardProps) {
  return (
    <article className={`rate-card ${isSelected ? "selected" : ""}`}>
      <header>
        <h4>{rate.name}</h4>
        <p className="rate-price">EUR {rate.grossTotal.toFixed(2)}</p>
      </header>
      <p className="rate-policy">{rate.cancellationPolicy}</p>
      <ul>
        <li>{rate.refundable ? "Refundable" : "Non-refundable"}</li>
        {rate.includedServices.map((service) => (
          <li key={service}>{service}</li>
        ))}
      </ul>
      <button
        type="button"
        className={`button ${isSelected ? "secondary" : "primary"}`}
        onClick={() => onSelect(rate.id)}
      >
        {isSelected ? "Selected" : "Select rate"}
      </button>
    </article>
  );
}


