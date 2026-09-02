import { formatDate } from "../../utils/date";
import { billingCycleLabel } from "../../utils/format";

const STEP_MONTHS = { monthly: 1, quarterly: 3, yearly: 12 };

/**
 * Illustrative renewal history — derived from the billing cycle rather than a
 * real ledger (there's no backend yet). Steps back from the next renewal date.
 */
export default function RenewalHistory({ service }) {
  const step = STEP_MONTHS[service.billingCycle];
  const base = new Date(service.renewalDate);
  const validBase = !Number.isNaN(base.getTime());

  const past = [];
  if (step && validBase) {
    for (let i = 1; i <= 3; i += 1) {
      const d = new Date(base);
      d.setMonth(d.getMonth() - step * i);
      past.push(d);
    }
  }

  return (
    <section className="detail-section" aria-labelledby="renewal-history-title">
      <h2 id="renewal-history-title" className="detail-section__title">
        Renewal history
      </h2>

      {!step ? (
        <p className="detail-section__empty">
          One-time purchase — no renewal history.
        </p>
      ) : past.length === 0 ? (
        <p className="detail-section__empty">No renewal history yet.</p>
      ) : (
        <>
          <ul className="history-list">
            {past.map((d) => (
              <li key={d.toISOString()} className="history-list__item">
                <span>Renewed</span>
                <span className="history-list__date">
                  {formatDate(d.toISOString())}
                </span>
              </li>
            ))}
          </ul>
          <p className="detail-section__note">
            Illustrative, based on the{" "}
            {billingCycleLabel(service.billingCycle).toLowerCase()} cycle.
          </p>
        </>
      )}
    </section>
  );
}
