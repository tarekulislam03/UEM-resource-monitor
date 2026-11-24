import { Zap, Droplets, IndianRupee, Leaf } from 'lucide-react';

function formatNumber(n) {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(n);
}

export default function SummaryCards({ summary }) {
  const cards = [
    {
      label: 'Total Electricity',
      value: `${formatNumber(summary.totalKwh)} kWh`,
      icon: Zap,
    },
    {
      label: 'Total Water',
      value: `${formatNumber(summary.totalWater)} L`,
      icon: Droplets,
    },
    {
      label: 'Estimated Cost',
      value: `Rs ${formatNumber(summary.estimatedCost)}`,
      icon: IndianRupee,
    },
    {
      label: 'CO2',
      value: `${formatNumber(summary.totalCo2Kg)} kg`,
      icon: Leaf,
    },
  ];

  return (
    <section className="summary-grid" aria-label="Campus usage summary">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="glass-panel glass-panel--interactive stat-card"
          >
            <div className="stat-card__top">
              <span>{card.label}</span>
              <span className="stat-card__icon">
                <Icon size={16} />
              </span>
            </div>
            <div className="stat-card__value">{card.value}</div>
          </div>
        );
      })}
    </section>
  );
}
