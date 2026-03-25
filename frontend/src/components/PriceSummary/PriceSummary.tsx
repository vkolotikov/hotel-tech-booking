import { useMemo, useState } from "react";
import { useBookingStore } from "../../store/bookingStore";

type SummaryIconName = "leaf" | "calendar" | "guests" | "home" | "info";

function SummaryIcon({ name }: { name: SummaryIconName }) {
  if (name === "leaf") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M20 4c-6.6.3-10.8 2.5-13.2 6.4-1.3 2.2-1.8 4.6-1.8 7.6h2c0-2.6.4-4.5 1.5-6.3 2.1-3.3 5.7-5.1 11.5-5.5v2.8l3-3-3-3V4Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10Zm0-4H6v2h12V6Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (name === "guests") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0h-2a5 5 0 0 0-10 0H5Zm15-6a3 3 0 1 0-2.9-3.9A3 3 0 0 0 20 14Zm-2.4 2a5 5 0 0 1 4.4 4h-2a3 3 0 0 0-2.6-2.1.9.9 0 0 0 .2-.8Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 3 10v11h7v-6h4v6h7V10l-9-7Zm0 2.6 7 5.4v8h-3v-6H8v6H5v-8l7-5.4Z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11 7h2v7h-2V7Zm0 9h2v2h-2v-2Zm1-14a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" fill="currentColor" />
    </svg>
  );
}

interface PriceSummaryProps {
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionType?: "button" | "submit";
  actionFormId?: string;
}

export function PriceSummary({
  actionLabel,
  onAction,
  actionDisabled = false,
  actionType = "button",
  actionFormId,
}: PriceSummaryProps) {
  const [expanded, setExpanded] = useState(false);
  const search = useBookingStore((state) => state.search);
  const selectedUnit = useBookingStore((state) => state.selectedUnit);
  const selectedRateId = useBookingStore((state) => state.selectedRateId);
  const ratesByUnit = useBookingStore((state) => state.ratesByUnit);
  const quote = useBookingStore((state) => state.quote);
  const extras = useBookingStore((state) => state.extras);
  const config = useBookingStore((state) => state.config);

  const selectedRate = useMemo(() => {
    if (!selectedUnit) return null;
    return ratesByUnit[selectedUnit.id]?.rates.find((rate) => rate.id === selectedRateId) ?? null;
  }, [ratesByUnit, selectedRateId, selectedUnit]);

  const selectedExtras = useMemo(() => {
    const catalog = config?.extras ?? [];
    return catalog.filter((extra) => extras.includes(extra.code));
  }, [config?.extras, extras]);

  const dateRangeLabel = useMemo(() => {
    if (!search.checkIn || !search.checkOut) return "Select dates";

    const checkInDate = new Date(search.checkIn);
    const checkOutDate = new Date(search.checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return `${search.checkIn} to ${search.checkOut}`;
    }

    const formatter = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return `${formatter.format(checkInDate)} to ${formatter.format(checkOutDate)}`;
  }, [search.checkIn, search.checkOut]);

  const nights = useMemo(() => {
    if (!search.checkIn || !search.checkOut) return null;
    const checkInDate = new Date(search.checkIn);
    const checkOutDate = new Date(search.checkOut);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) return null;

    const nightsValue = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000);
    return nightsValue > 0 ? nightsValue : null;
  }, [search.checkIn, search.checkOut]);

  const guestLabel = `${search.adults} adult${search.adults === 1 ? "" : "s"}${
    search.children > 0 ? `, ${search.children} child${search.children === 1 ? "" : "ren"}` : ""
  }`;

  const roomPrice = quote?.pricing.roomGross ?? selectedRate?.grossTotal ?? selectedUnit?.baseGross ?? 0;
  const guestCount = Math.max(search.adults + search.children, 1);
  const nightsCount = Math.max(nights ?? 1, 1);

  const fallbackExtrasBreakdown = useMemo(
    () =>
      selectedExtras.map((extra) => {
        let quantity = 1;
        if (extra.pricingModel === "per_day") {
          quantity = nightsCount;
        } else if (extra.pricingModel === "per_guest") {
          quantity = guestCount;
        }

        const lineGross = extra.priceGross * quantity;
        return {
          code: extra.code,
          lineGross,
        };
      }),
    [guestCount, nightsCount, selectedExtras],
  );

  const fallbackExtrasGross = useMemo(
    () => fallbackExtrasBreakdown.reduce((sum, item) => sum + item.lineGross, 0),
    [fallbackExtrasBreakdown],
  );

  const total = quote?.pricing.grossTotal ?? roomPrice + fallbackExtrasGross;

  return (
    <aside className={`price-summary ${expanded ? "expanded" : ""}`}>
      <button type="button" className="summary-toggle" onClick={() => setExpanded((value) => !value)}>
        <span className="summary-toggle-title">
          <SummaryIcon name="leaf" />
          Your stay summary
        </span>
        <span className="summary-toggle-total">EUR {total.toFixed(2)}</span>
      </button>

      <div className="summary-body">
        {selectedUnit ? (
          <div className="summary-hero">
            <img src={selectedUnit.heroImage} alt={selectedUnit.name} className="summary-hero-image" />
            <div className="summary-hero-overlay">
              <p className="summary-hero-label">Selected stay</p>
              <h3>{selectedUnit.name}</h3>
            </div>
          </div>
        ) : null}

        <div className="summary-section">
          <div className="summary-item">
            <span className="summary-item-icon">
              <SummaryIcon name="calendar" />
            </span>
            <div>
              <p className="summary-item-label">Stay dates</p>
              <p className="summary-item-value">{dateRangeLabel}</p>
              {nights !== null ? (
                <p className="summary-item-meta">
                  {nights} night{nights === 1 ? "" : "s"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="summary-item">
            <span className="summary-item-icon">
              <SummaryIcon name="guests" />
            </span>
            <div>
              <p className="summary-item-label">Guests</p>
              <p className="summary-item-value">{guestLabel}</p>
            </div>
          </div>

          {selectedUnit ? (
            <div className="summary-item">
              <span className="summary-item-icon">
                <SummaryIcon name="home" />
              </span>
              <div>
                <p className="summary-item-label">Selected stay</p>
                <p className="summary-item-value">{selectedUnit.name}</p>
              </div>
            </div>
          ) : null}
        </div>

        {selectedUnit ? (
          <div className="summary-pricing">
            <div className="summary-row">
              <span>Room rate</span>
              <strong>EUR {roomPrice.toFixed(2)}</strong>
            </div>

            {selectedExtras.map((extra) => (
              <div key={extra.code} className="summary-row">
                <span>{extra.name}</span>
                <strong>
                  EUR{" "}
                  {(
                    quote?.extras.find((item) => item.code === extra.code)?.lineGross ??
                    fallbackExtrasBreakdown.find((item) => item.code === extra.code)?.lineGross ??
                    extra.priceGross
                  ).toFixed(2)}
                </strong>
              </div>
            ))}

            <div className="summary-total">
              <span>Total (incl. taxes & fees)</span>
              <strong>EUR {total.toFixed(2)}</strong>
            </div>
          </div>
        ) : (
          <div className="summary-placeholder">
            <span className="summary-placeholder-icon">
              <SummaryIcon name="info" />
            </span>
            <p>Choose a room to unlock full pricing and confirm your stay.</p>
          </div>
        )}

        {actionLabel ? (
          <div className="summary-actions">
            <button
              type={actionType}
              form={actionFormId}
              className="button primary summary-action-button"
              onClick={actionType === "button" ? onAction : undefined}
              disabled={actionDisabled}
            >
              {actionLabel}
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}


