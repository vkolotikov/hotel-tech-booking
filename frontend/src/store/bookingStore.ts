import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  AvailabilityData,
  AvailabilityUnit,
  BillingDetails,
  ConfigData,
  ConfirmData,
  GuestDetails,
  QuoteData,
  SearchCriteria,
  UnitRatesData,
} from "../types/api";

function isoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const defaultSearch: SearchCriteria = {
  checkIn: isoDate(14),
  checkOut: isoDate(16),
  adults: 2,
  children: 0,
  promoCode: "",
};

const defaultGuest: GuestDetails = {
  title: "Guest",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  nationality: "Latvia",
};

const defaultBilling: BillingDetails = {
  address: "Not provided",
  zipCode: "N/A",
  city: "Not provided",
  country: "Latvia",
};

interface Consents {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

interface BookingStore {
  config: ConfigData | null;
  search: SearchCriteria;
  availability: AvailabilityData | null;
  selectedUnit: AvailabilityUnit | null;
  ratesByUnit: Record<string, UnitRatesData>;
  selectedRateId: string;
  extras: string[];
  quote: QuoteData | null;
  guest: GuestDetails;
  billing: BillingDetails;
  notes: string;
  consents: Consents;
  confirmation: ConfirmData | null;
  errorMessage: string;

  setConfig: (config: ConfigData) => void;
  setSearch: (search: SearchCriteria) => void;
  setAvailability: (availability: AvailabilityData) => void;
  selectUnit: (unit: AvailabilityUnit | null) => void;
  setUnitRates: (unitId: string, rates: UnitRatesData) => void;
  setSelectedRateId: (rateId: string) => void;
  toggleExtra: (extraCode: string) => void;
  setQuote: (quote: QuoteData | null) => void;
  setGuest: (guest: GuestDetails) => void;
  setBilling: (billing: BillingDetails) => void;
  setNotes: (notes: string) => void;
  setConsents: (consents: Consents) => void;
  setConfirmation: (confirmation: ConfirmData | null) => void;
  setErrorMessage: (message: string) => void;
  resetAfterSearch: () => void;
  resetAll: () => void;
}

const initialState = {
  config: null as ConfigData | null,
  search: defaultSearch,
  availability: null as AvailabilityData | null,
  selectedUnit: null as AvailabilityUnit | null,
  ratesByUnit: {} as Record<string, UnitRatesData>,
  selectedRateId: "",
  extras: [] as string[],
  quote: null as QuoteData | null,
  guest: defaultGuest,
  billing: defaultBilling,
  notes: "",
  consents: { termsAccepted: false, privacyAccepted: false },
  confirmation: null as ConfirmData | null,
  errorMessage: "",
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setConfig: (config) => set({ config }),
      setSearch: (search) => set({ search }),
      setAvailability: (availability) => set({ availability }),
      selectUnit: (unit) => set({ selectedUnit: unit, selectedRateId: "", quote: null }),
      setUnitRates: (unitId, rates) =>
        set((state) => ({ ratesByUnit: { ...state.ratesByUnit, [unitId]: rates } })),
      setSelectedRateId: (rateId) => set({ selectedRateId: rateId, quote: null }),
      toggleExtra: (extraCode) =>
        set((state) => {
          const isSelected = state.extras.includes(extraCode);
          return {
            extras: isSelected
              ? state.extras.filter((item) => item !== extraCode)
              : [...state.extras, extraCode],
            quote: null,
          };
        }),
      setQuote: (quote) => set({ quote }),
      setGuest: (guest) => set({ guest }),
      setBilling: (billing) => set({ billing }),
      setNotes: (notes) => set({ notes }),
      setConsents: (consents) => set({ consents }),
      setConfirmation: (confirmation) => set({ confirmation }),
      setErrorMessage: (errorMessage) => set({ errorMessage }),
      resetAfterSearch: () =>
        set({
          availability: null,
          selectedUnit: null,
          ratesByUnit: {},
          selectedRateId: "",
          extras: [],
          quote: null,
          guest: defaultGuest,
          billing: defaultBilling,
          notes: "",
          consents: { termsAccepted: false, privacyAccepted: false },
          confirmation: null,
          errorMessage: "",
        }),
      resetAll: () => set({ ...initialState, config: get().config, search: defaultSearch }),
    }),
    {
      name: "forrest_booking_v1",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        config: state.config,
        search: state.search,
        availability: state.availability,
        selectedUnit: state.selectedUnit,
        ratesByUnit: state.ratesByUnit,
        selectedRateId: state.selectedRateId,
        extras: state.extras,
        quote: state.quote,
        guest: state.guest,
        billing: state.billing,
        notes: state.notes,
        consents: state.consents,
        confirmation: state.confirmation,
      }),
    },
  ),
);
