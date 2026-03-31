interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: 'purple' | 'cyan' | 'amber' | 'green' | 'pink' | 'red';
}

export default function StatCard({ icon, value, label, color = 'purple' }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className={`stat-card-icon ${color}`}>
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}
