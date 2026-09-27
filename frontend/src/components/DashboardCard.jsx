import "../styles/DashboardCard.css";

function DashboardCard({ icon, title, value }) {
  return (
    <div className="dashboard-card">

      <div className="card-icon">
        {icon}
      </div>

      <div className="card-content">
        <h4>{title}</h4>
        <h2>{value}</h2>
      </div>

    </div>
  );
}

export default DashboardCard;