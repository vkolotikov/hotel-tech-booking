import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";

type MixItem = {
  key?: string;
  label: string;
  value: number;
};

type SeriesPoint = {
  label: string;
  value: number;
};

type PerformanceItem = {
  unitId: string;
  unitName: string;
  bookingCount: number;
  revenue: number;
  balanceDue: number;
  averageStayNights: number;
};

function chartColor(index: number): string {
  return `var(--admin-chart-${(index % 6) + 1})`;
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

type TooltipState = {
  title: string;
  detail: string;
  x: number;
  y: number;
} | null;

type ChartHoverState = {
  title: string;
  detail: string;
};

function buildTooltipPosition(event: ReactMouseEvent<HTMLElement | SVGElement> | ReactPointerEvent<HTMLElement | SVGElement>): { x: number; y: number } {
  return {
    x: event.clientX + 16,
    y: event.clientY - 14,
  };
}

function ChartTooltip({ tooltip }: { tooltip: TooltipState }) {
  if (tooltip === null) {
    return null;
  }

  return (
    <div className="admin-chart-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      <strong>{tooltip.title}</strong>
      <span>{tooltip.detail}</span>
    </div>
  );
}

export function AdminDonutChart({
  items,
  title,
  subtitle,
}: {
  items: MixItem[];
  title: string;
  subtitle: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const filteredItems = items.filter((item) => item.value > 0);
  const total = filteredItems.reduce((sum, item) => sum + item.value, 0);
  const defaultHover = useMemo<ChartHoverState>(() => {
    const topItem = items.reduce<MixItem | null>((current, item) => {
      if (current === null || item.value > current.value) {
        return item;
      }
      return current;
    }, null);

    return {
      title: topItem?.label ?? "No payment data",
      detail: topItem ? `${topItem.value} bookings / ${Math.round((topItem.value / Math.max(total, 1)) * 100)}% share` : "No tracked bookings in this scope.",
    };
  }, [items, total]);
  const [active, setActive] = useState<ChartHoverState>(defaultHover);

  useEffect(() => {
    setActive(defaultHover);
  }, [defaultHover]);

  const size = 172;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let dashOffset = 0;

  const activate = (titleValue: string, detailValue: string) => {
    setActive({ title: titleValue, detail: detailValue });
  };

  return (
    <article className="admin-analytics-card admin-chart-card">
      <ChartTooltip tooltip={tooltip} />
      <div className="admin-panel-header compact">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="admin-chart-insight">
        <strong>{active.title}</strong>
        <span>{active.detail}</span>
      </div>

      <div className="admin-donut-layout">
        <div className="admin-donut-wrap">
          <svg viewBox={`0 0 ${size} ${size}`} className="admin-donut-chart" aria-hidden="true">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--admin-chart-track)"
              strokeWidth={strokeWidth}
            />
            {filteredItems.map((item, index) => {
              const fraction = total > 0 ? item.value / total : 0;
              const dashLength = circumference * fraction;
              const circle = (
                <circle
                  key={item.key ?? item.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={chartColor(index)}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                  strokeDashoffset={-dashOffset}
                  transform={`rotate(-90 ${size / 2} ${size / 2})`}
                  onPointerEnter={(event) => {
                    activate(item.label, `${item.value} bookings / ${Math.round((item.value / Math.max(total, 1)) * 100)}% share`);
                    setTooltip({
                      title: item.label,
                      detail: `${item.value} bookings`,
                      ...buildTooltipPosition(event),
                    });
                  }}
                  onPointerMove={(event) =>
                    setTooltip((current) =>
                      current
                        ? {
                            ...current,
                            ...buildTooltipPosition(event),
                          }
                        : current,
                    )
                  }
                  onPointerLeave={() => {
                    setTooltip(null);
                    setActive(defaultHover);
                  }}
                />
              );
              dashOffset += dashLength;
              return circle;
            })}
          </svg>
          <div className="admin-donut-center">
            <strong>{total}</strong>
            <span>tracked stays</span>
          </div>
        </div>

        <div className="admin-chart-legend">
          {items.map((item, index) => (
            <div
              key={item.key ?? item.label}
              className="admin-chart-legend-item"
              onPointerEnter={(event) => {
                activate(item.label, `${item.value} bookings / ${Math.round((item.value / Math.max(total, 1)) * 100)}% share`);
                setTooltip({
                  title: item.label,
                  detail: `${item.value} bookings`,
                  ...buildTooltipPosition(event),
                });
              }}
              onPointerMove={(event) =>
                setTooltip((current) =>
                  current
                    ? {
                        ...current,
                        ...buildTooltipPosition(event),
                      }
                    : current,
                )
              }
              onPointerLeave={() => {
                setTooltip(null);
                setActive(defaultHover);
              }}
            >
              <span className="admin-chart-swatch" style={{ background: chartColor(index) }} />
              <div>
                <strong>{item.label}</strong>
                <p>{item.value} bookings</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

export function AdminBarsChart({
  points,
  title,
  subtitle,
}: {
  points: SeriesPoint[];
  title: string;
  subtitle: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const max = Math.max(...points.map((point) => point.value), 1);
  const peakPoint = points.reduce<SeriesPoint | null>((peak, point) => {
    if (peak === null || point.value > peak.value) {
      return point;
    }
    return peak;
  }, null);
  const tickValues = [max, Math.round((max * 2) / 3), Math.round(max / 3), 0]
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort((left, right) => right - left);
  const defaultHover = peakPoint
    ? { title: peakPoint.label, detail: `${peakPoint.value} arrivals in the selected scope` }
    : { title: "No arrivals", detail: "No arrivals in the selected scope." };
  const [active, setActive] = useState<ChartHoverState>(defaultHover);

  useEffect(() => {
    setActive(defaultHover);
  }, [defaultHover]);

  return (
    <article className="admin-analytics-card admin-chart-card">
      <ChartTooltip tooltip={tooltip} />
      <div className="admin-panel-header compact">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {peakPoint ? <span className="admin-bars-peak">Peak {peakPoint.label}: {peakPoint.value}</span> : null}
      </div>
      <div className="admin-chart-insight">
        <strong>{active.title}</strong>
        <span>{active.detail}</span>
      </div>

      <div className="admin-bars-layout">
        <div className="admin-bars-scale" aria-hidden="true">
          {tickValues.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div className="admin-bars-chart" style={{ "--bar-columns": points.length } as CSSProperties}>
          {points.map((point) => {
            const isPeak = point.value === (peakPoint?.value ?? -1) && point.value > 0;
            const hasValue = point.value > 0;
            const style = {
              "--bar-height": `${Math.max((point.value / max) * 100, point.value > 0 ? 10 : 2)}%`,
            } as CSSProperties;

            return (
              <div
                key={point.label}
                className="admin-bars-column"
                onPointerEnter={(event) => {
                  setActive({ title: point.label, detail: `${point.value} arrivals in the selected scope` });
                  setTooltip({
                    title: point.label,
                    detail: `${point.value} arrivals`,
                    ...buildTooltipPosition(event),
                  });
                }}
                onPointerMove={(event) =>
                  setTooltip((current) =>
                    current
                      ? {
                          ...current,
                          ...buildTooltipPosition(event),
                        }
                      : current,
                  )
                }
                onPointerLeave={() => {
                  setTooltip(null);
                  setActive(defaultHover);
                }}
              >
                <span className={`admin-bars-value ${hasValue ? "visible" : ""}`}>{point.value}</span>
                <div className="admin-bars-track">
                  <div className={`admin-bars-bar ${isPeak ? "peak" : ""}`} style={style} />
                </div>
                <span className="admin-bars-label">{point.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

export function AdminHorizontalBars({
  items,
  title,
  subtitle,
}: {
  items: PerformanceItem[];
  title: string;
  subtitle: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const maxRevenue = Math.max(...items.map((item) => item.revenue), 1);
  const defaultHover = useMemo<ChartHoverState>(() => {
    const topUnit = items.reduce<PerformanceItem | null>((current, item) => {
      if (current === null || item.revenue > current.revenue) {
        return item;
      }
      return current;
    }, null);

    return topUnit
      ? {
          title: topUnit.unitName,
          detail: `Revenue EUR ${topUnit.revenue.toFixed(2)} / Due EUR ${topUnit.balanceDue.toFixed(2)} / ${topUnit.bookingCount} bookings / Avg ${topUnit.averageStayNights.toFixed(1)} nights`,
        }
      : { title: "No unit data", detail: "No unit performance data in this scope." };
  }, [items]);
  const [active, setActive] = useState<ChartHoverState>(defaultHover);

  useEffect(() => {
    setActive(defaultHover);
  }, [defaultHover]);

  return (
    <article className="admin-analytics-card admin-chart-card">
      <ChartTooltip tooltip={tooltip} />
      <div className="admin-panel-header compact">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="admin-chart-insight">
        <strong>{active.title}</strong>
        <span>{active.detail}</span>
      </div>

      <div className="admin-horizontal-bars">
        {items.map((item, index) => (
          <div
            key={item.unitId}
            className="admin-horizontal-row"
            onPointerEnter={(event) => {
              const detail = `Revenue EUR ${item.revenue.toFixed(2)} / Due EUR ${item.balanceDue.toFixed(2)} / ${item.bookingCount} bookings / Avg ${item.averageStayNights.toFixed(1)} nights`;
              setActive({ title: item.unitName, detail });
              setTooltip({
                title: item.unitName,
                detail,
                ...buildTooltipPosition(event),
              });
            }}
            onPointerMove={(event) =>
              setTooltip((current) =>
                current
                  ? {
                      ...current,
                      ...buildTooltipPosition(event),
                    }
                  : current,
              )
            }
            onPointerLeave={() => {
              setTooltip(null);
              setActive(defaultHover);
            }}
          >
            <div className="admin-horizontal-label">
              <strong>{item.unitName}</strong>
              <p>
                {item.bookingCount} bookings / avg {item.averageStayNights.toFixed(1)} nights
              </p>
            </div>
            <div className="admin-horizontal-track">
              <div
                className="admin-horizontal-fill"
                style={
                  {
                    "--fill-width": `${Math.max((item.revenue / maxRevenue) * 100, item.revenue > 0 ? 12 : 0)}%`,
                    "--fill-color": chartColor(index),
                  } as CSSProperties
                }
              />
            </div>
            <div className="admin-horizontal-meta">
              <strong>EUR {formatCompact(item.revenue)}</strong>
              <span>Due EUR {item.balanceDue.toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function AdminChannelList({
  items,
  title,
  subtitle,
}: {
  items: Array<{ label: string; value: number }>;
  title: string;
  subtitle: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const defaultHover = useMemo<ChartHoverState>(() => {
    const topSource = items.reduce<{ label: string; value: number } | null>((current, item) => {
      if (current === null || item.value > current.value) {
        return item;
      }
      return current;
    }, null);

    return topSource
      ? {
          title: topSource.label,
          detail: `${topSource.value} bookings (${Math.round((topSource.value / Math.max(total, 1)) * 100)}%)`,
        }
      : { title: "No source data", detail: "No booking sources in this scope." };
  }, [items, total]);
  const [active, setActive] = useState<ChartHoverState>(defaultHover);

  useEffect(() => {
    setActive(defaultHover);
  }, [defaultHover]);

  return (
    <article className="admin-analytics-card admin-chart-card">
      <ChartTooltip tooltip={tooltip} />
      <div className="admin-panel-header compact">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="admin-chart-insight">
        <strong>{active.title}</strong>
        <span>{active.detail}</span>
      </div>

      <div className="admin-channel-list">
        {items.map((item, index) => {
          const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div
              key={item.label}
              className="admin-channel-row"
              onPointerEnter={(event) => {
                const detail = `${item.value} bookings (${percentage}%)`;
                setActive({ title: item.label, detail });
                setTooltip({
                  title: item.label,
                  detail,
                  ...buildTooltipPosition(event),
                });
              }}
              onPointerMove={(event) =>
                setTooltip((current) =>
                  current
                    ? {
                        ...current,
                        ...buildTooltipPosition(event),
                      }
                    : current,
                )
              }
              onPointerLeave={() => {
                setTooltip(null);
                setActive(defaultHover);
              }}
            >
              <div className="admin-channel-copy">
                <span className="admin-chart-swatch" style={{ background: chartColor(index) }} />
                <strong>{item.label}</strong>
              </div>
              <div className="admin-channel-track">
                <div
                  className="admin-channel-fill"
                  style={
                    {
                      "--fill-width": `${percentage}%`,
                      "--fill-color": chartColor(index),
                    } as CSSProperties
                  }
                />
              </div>
              <span className="admin-channel-value">{item.value}</span>
            </div>
          );
        })}
      </div>
    </article>
  );
}
