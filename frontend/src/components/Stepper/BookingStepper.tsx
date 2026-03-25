import { Link } from "react-router-dom";

interface BookingStepperProps {
  currentStep: number;
}

const steps = [
  { id: 1, label: "Destination", shortLabel: "Search", path: "/" },
  { id: 2, label: "Rooms & Rates", shortLabel: "Rooms & Rates", path: "/extras" },
  { id: 3, label: "Extras", shortLabel: "Extras", path: "/extras" },
  { id: 4, label: "Confirm", shortLabel: "Confirm", path: "/success" },
];

export function BookingStepper({ currentStep }: BookingStepperProps) {
  return (
    <ol className="booking-stepper" aria-label="Booking progress">
      {steps.map((step) => {
        const status =
          currentStep === step.id ? "current" : currentStep > step.id ? "complete" : "upcoming";

        return (
          <li key={step.id} data-status={status}>
            {status === "complete" ? (
              <Link to={step.path} className="step-link">
                <span className="step-index">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9.6 16.6 5.7 12.7l1.4-1.4 2.5 2.5 7.3-7.3 1.4 1.4-8.7 8.7Z" fill="currentColor" />
                  </svg>
                </span>
                <span className="step-label" data-short={step.shortLabel}>{step.label}</span>
              </Link>
            ) : (
              <span className="step-link" aria-current={status === "current" ? "step" : undefined}>
                <span className="step-index">{step.id}</span>
                <span className="step-label" data-short={step.shortLabel}>{step.label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}


