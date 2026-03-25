export type ApiErrorDetails = Array<Record<string, unknown> | string> | Record<string, unknown>;

export interface ApiErrorPayload {
  code: string;
  message: string;
  details: ApiErrorDetails;
}

export interface ApiSuccessEnvelope<T> {
  success: true;
  data: T;
  meta: { requestId: string };
}

export interface ApiErrorEnvelope {
  success: false;
  error: ApiErrorPayload;
  meta: { requestId: string };
}

export interface UnitConfig {
  id: string;
  name: string;
  maxGuests: number;
  basePriceGross: number;
  heroImage: string;
  gallery: string[];
  description: string;
  includedServices: string[];
  policies: {
    checkIn: string;
    checkOut: string;
    cancellation: string;
  };
}

export interface ExtraConfig {
  code: string;
  name: string;
  description: string;
  details?: string;
  priceGross: number;
  pricingModel: "per_stay" | "per_day" | "per_guest";
}

export interface ConfigData {
  units: UnitConfig[];
  extras: ExtraConfig[];
  policies: {
    termsVersion: string;
    privacyVersion: string;
    currency: string;
    locale: string;
  };
  ui: {
    stickySummary: boolean;
    grossTotalPrimary: boolean;
    holdDurationMinutes: number;
  };
}

export interface AvailabilityUnit {
  id: string;
  name: string;
  maxGuests: number;
  heroImage: string;
  baseGross: number;
  description: string;
}

export interface AvailabilityData {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  units: AvailabilityUnit[];
}

export interface RatePlan {
  id: string;
  name: string;
  grossTotal: number;
  taxAmount: number;
  refundable: boolean;
  cancellationPolicy: string;
  includedServices: string[];
}

export interface UnitRatesData {
  unitId: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  rates: RatePlan[];
  cancellationPolicy: string;
  includedServices: string[];
}

export interface QuotePricing {
  roomGross: number;
  extrasGross: number;
  taxAmount: number;
  subtotal: number;
  grossTotal: number;
}

export interface QuoteSnapshot {
  unitId: string;
  rateId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  extras: string[];
  grossTotal: number;
}

export interface QuoteData {
  holdToken: string;
  holdExpiresAt: string;
  pricing: QuotePricing;
  extras: Array<{
    code: string;
    name: string;
    pricingModel: string;
    quantity: number;
    unitGross: number;
    lineGross: number;
  }>;
  quoteSnapshot: QuoteSnapshot;
}

export type PaymentMethod = "card" | "paypal" | "invoice";

export interface ConfirmData {
  bookingReference: string;
  status: string;
  createdAt: string;
  paymentMethod: PaymentMethod;
  paymentRequired: boolean;
  paymentUrl: string | null;
  paymentStatus: string;
}

export interface SearchCriteria {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  promoCode?: string;
}

export interface GuestDetails {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  nationality: string;
}

export interface BillingDetails {
  address: string;
  zipCode: string;
  city: string;
  country: string;
}
