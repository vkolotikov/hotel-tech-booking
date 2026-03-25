import type { KeyboardEvent } from "react";
import type { AvailabilityUnit } from "../../types/api";
import { assetUrl } from "../../config";

interface RoomCardProps {
  unit: AvailabilityUnit;
  isSelected: boolean;
  onSelect: (unit: AvailabilityUnit) => void;
  onViewDetails?: (unit: AvailabilityUnit) => void;
  isSelecting?: boolean;
}

type Amenity = "kitchen" | "bbq" | "sauna" | "jacuzzi";

function AmenityIcon({ amenity }: { amenity: Amenity }) {
  if (amenity === "kitchen") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 4h16v16H4V4Zm2 2v4h12V6H6Zm0 6v6h5v-6H6Zm7 0v6h5v-6h-5Z" fill="currentColor" />
      </svg>
    );
  }

  if (amenity === "bbq") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 10a6 6 0 1 1 12 0h1v2h-1.1a6 6 0 0 1-4.9 5.8V20h3v2H8v-2h3v-2.2A6 6 0 0 1 6.1 12H5v-2h1Zm2 0a4 4 0 1 0 8 0H8Z" fill="currentColor" />
      </svg>
    );
  }

  if (amenity === "sauna") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v7h-2v-7a3 3 0 0 0-3-3H9a3 3 0 0 0-3 3v7H4v-7Zm4-9h2c0 1.6-.7 2.4-1.2 3-.4.5-.8.9-.8 2H6c0-1.6.7-2.4 1.2-3 .4-.5.8-.9.8-2Zm6 0h2c0 1.6-.7 2.4-1.2 3-.4.5-.8.9-.8 2h-2c0-1.6.7-2.4 1.2-3 .4-.5.8-.9.8-2Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4a7 7 0 0 1 7 7v5h1v2H4v-2h1v-5a7 7 0 0 1 7-7Zm0 2a5 5 0 0 0-5 5v5h10v-5a5 5 0 0 0-5-5Zm-2 5h4v2h-4v-2Z" fill="currentColor" />
    </svg>
  );
}

function amenityLabel(amenity: Amenity): string {
  if (amenity === "kitchen") return "Kitchen";
  if (amenity === "bbq") return "BBQ";
  if (amenity === "sauna") return "Sauna";
  return "Jacuzzi";
}

function roomAmenities(name: string): Amenity[] {
  const normalized = name.toLowerCase();
  if (normalized.includes("sauna") || normalized.includes("deluxe")) {
    return ["kitchen", "bbq", "sauna", "jacuzzi"];
  }

  if (normalized.includes("no.5")) {
    return ["kitchen", "bbq", "jacuzzi", "sauna"];
  }

  return ["kitchen", "bbq", "sauna", "jacuzzi"];
}

function roomTags(unit: AvailabilityUnit): string[] {
  const tags = ["Forest view"];
  if (unit.name.toLowerCase().includes("sauna")) {
    tags.push("Sauna experience");
  }
  if (unit.name.toLowerCase().includes("tiny")) {
    tags.push("Cozy design");
  } else {
    tags.push("Private terrace");
  }
  return tags;
}

function fallbackImage(name: string): string {
  const map: Record<string, string> = {
    "ForRest DeLuxe House": "ForRest-DeLuxe-House.jpg",
    "ForRest Lodge": "ForRest_Lodge.jpg",
    "ForRest No.5": "ForRest_No5.jpg",
    "ForRest Sauna Lodge": "ForRest_Sauna_Lodge.jpg",
    "ForRest Tiny House": "ForRest_Tiny_House.jpg",
    "Sauna House": "ForRest_Sauna_house.jpg",
  };

  return assetUrl(`/assets/images/${map[name] ?? "ForRest_Lodge.jpg"}`);
}

export function RoomCard({ unit, isSelected, onSelect, onViewDetails, isSelecting = false }: RoomCardProps) {
  const tags = roomTags(unit);
  const amenities = roomAmenities(unit.name);
  const imageSrc = unit.heroImage || fallbackImage(unit.name);

  const handleActivate = (): void => {
    if (!isSelecting) {
      onSelect(unit);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleActivate();
    }
  };

  return (
    <article
      className={`room-card ${isSelected ? "selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      aria-label={`Choose ${unit.name}`}
    >
      <div className="room-media">
        <img src={imageSrc} alt={unit.name} className="room-image" />
      </div>

      <div className="room-content">
        <h3 className="room-title">{unit.name}</h3>
        <div className="room-specs">
          <span>Max {unit.maxGuests} guests</span>
          <span>Private house</span>
          <span>Nature stay</span>
        </div>
        <div className="room-tags">
          {tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p className="room-description">{unit.description}</p>
        <ul className="room-amenities">
          {amenities.map((amenity) => (
            <li key={amenity}>
              <span className="room-amenity-icon">
                <AmenityIcon amenity={amenity} />
              </span>
              <span>{amenityLabel(amenity)}</span>
            </li>
          ))}
        </ul>
        {onViewDetails ? (
          <button
            type="button"
            className="room-details-link"
            onClick={(event) => {
              event.stopPropagation();
              onViewDetails(unit);
            }}
            disabled={isSelecting}
          >
            See room details
          </button>
        ) : null}
      </div>

      <div className="room-pricing">
        <p className="room-price-meta">Taxes and fees included</p>
        <p className="room-price-label">From</p>
        <p className="room-price-value">EUR {unit.baseGross.toFixed(2)}</p>
        <p className="room-price-note">Real-time availability</p>
        <div className="room-actions">
          <button
            type="button"
            className="button primary room-select-button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(unit);
            }}
            disabled={isSelecting}
          >
            {isSelecting ? "Preparing..." : "Choose this room"}
          </button>
        </div>
      </div>
    </article>
  );
}


