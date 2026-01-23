import { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { fetchRoadAlerts, RoadAlert } from '../utils/roadAlertApi';
import './Home.css';

const Home: React.FC = () => {
  const [alerts, setAlerts] = useState<RoadAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchRoadAlerts();
      setAlerts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatBudget = (budget: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      maximumFractionDigits: 0,
    }).format(budget);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'terminé':
        return 'status-badge status-completed';
      case 'en cours':
        return 'status-badge status-ongoing';
      default:
        return 'status-badge status-new';
    }
  };

  return (
    <IonPage className="home-page">
      <IonContent fullscreen>
        {/* NAVBAR */}
        <nav className="navbar">
          <div className="navbar-brand">
            Road<span className="brand-accent">Alert</span> <span className="brand-subtitle">Tana</span>
          </div>

          <div className="navbar-search">
            <input type="text" placeholder="Rechercher une zone..." className="search-input" />
          </div>

          <div className="navbar-right">
            <button className="btn-sync">
              <i className="fas fa-sync-alt"></i>
              <span>Synchroniser</span>
            </button>
            <div className="user-profile">
              <div className="profile-info">
                <p className="profile-label">Utilisateur</p>
              </div>
              <div className="profile-avatar">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=User" alt="profile" />
              </div>
            </div>
          </div>
        </nav>

        {/* CONTENU */}
        <main className="home-content">
          <div className="content-wrapper">
            <div className="header-section">
              <h1>Signalements Routiers</h1>
              <p className="subtitle">Gestion des signalements routiers à Tana</p>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Chargement des signalements...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
                <button onClick={loadAlerts} className="btn-retry">Réessayer</button>
              </div>
            ) : alerts.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-inbox"></i>
                <p>Aucun signalement disponible</p>
              </div>
            ) : (
              <div className="table-container floating-card">
                <table className="alerts-table">
                  <thead>
                    <tr>
                      <th>Lieu</th>
                      <th>Date</th>
                      <th>Surface</th>
                      <th>Budget</th>
                      <th>Entreprise</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map((alert, index) => (
                      <tr key={index} className="table-row">
                        <td className="cell-location">
                          <div className="location-info">
                            <i className="fas fa-map-pin"></i>
                            <span>{alert.concerned_entreprise}</span>
                          </div>
                        </td>
                        <td>{formatDate(alert.date_alert)}</td>
                        <td>{alert.surface} m²</td>
                        <td className="cell-budget">{formatBudget(alert.budget)}</td>
                        <td>
                          <span className="badge-company">{alert.concerned_entreprise}</span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(alert.status)}>
                            {alert.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>

        {/* FOOTER */}
        <footer className="home-footer">
          <div className="footer-nav">
            <button className="footer-btn active">
              <i className="fas fa-home"></i>
            </button>
            <button className="footer-btn">
              <i className="fas fa-map-marked-alt"></i>
            </button>
            <button className="footer-btn">
              <i className="fas fa-plus-circle"></i>
            </button>
            <button className="footer-btn">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default Home;
