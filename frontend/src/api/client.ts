import type {
  ApiErrorEnvelope,
  ApiErrorPayload,
  ApiSuccessEnvelope,
  AvailabilityData,
  ConfigData,
  ConfirmData,
  PaymentMethod,
  QuoteData,
  SearchCriteria,
  UnitRatesData,
} from "../types/api";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly error: ApiErrorPayload,
  ) {
    super(message);
  }
}

type RequestOptions = RequestInit & {
  idempotencyKey?: string;
};

import { API_PREFIX } from "../config";

const API_BASE = `${API_PREFIX}/api/v1`;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });

  const body = (await response.json()) as ApiSuccessEnvelope<T> | ApiErrorEnvelope;

  if (!response.ok || !body.success) {
    const errorPayload = !body.success
      ? body.error
      : { code: "http_error", message: "Request failed.", details: [] };

    throw new ApiClientError(errorPayload.message, response.status, errorPayload);
  }

  return body.data;
}

export const apiClient = {
  getConfig(): Promise<ConfigData> {
    return request<ConfigData>("/config");
  },

  getAvailability(criteria: SearchCriteria): Promise<AvailabilityData> {
    const params = new URLSearchParams({
      checkIn: criteria.checkIn,
      checkOut: criteria.checkOut,
      adults: String(criteria.adults),
      children: String(criteria.children),
    });

    if (criteria.promoCode) {
      params.set("promoCode", criteria.promoCode);
    }

    return request<AvailabilityData>(`/availability?${params.toString()}`);
  },

  getUnitRates(unitId: string, criteria: SearchCriteria): Promise<UnitRatesData> {
    const params = new URLSearchParams({
      checkIn: criteria.checkIn,
      checkOut: criteria.checkOut,
      adults: String(criteria.adults),
      children: String(criteria.children),
    });

    return request<UnitRatesData>(`/unit/${encodeURIComponent(unitId)}/rates?${params.toString()}`);
  },

  quote(payload: {
    unitId: string;
    dates: { checkIn: string; checkOut: string };
    guests: { adults: number; children: number };
    rateId: string;
    extras: string[];
  }): Promise<QuoteData> {
    return request<QuoteData>("/booking/quote", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  confirm(
    payload: {
      holdToken: string;
      quote: {
        unitId: string;
        rateId: string;
        checkIn: string;
        checkOut: string;
        adults: number;
        children: number;
        extras: string[];
        grossTotal: number;
      };
      guest: {
        title: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        nationality: string;
      };
      billing: {
        address: string;
        zipCode: string;
        city: string;
        country: string;
      };
      notes: string;
      consents: {
        termsAccepted: boolean;
        privacyAccepted: boolean;
        version: string;
      };
      paymentMethod: PaymentMethod;
    },
    idempotencyKey: string,
  ): Promise<ConfirmData> {
    return request<ConfirmData>("/booking/confirm", {
      method: "POST",
      body: JSON.stringify(payload),
      idempotencyKey,
    });
  },
};
