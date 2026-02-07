import { useEffect, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api, Signalement } from '../utils/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalPoints: number;
  totalSurface: number;
  totalBudget: number;
  progressPercentage: number;
}

interface CompanyStats {
  name: string;
  percentage: number;
  count: number;
}

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Signalement[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalPoints: 0,
    totalSurface: 0,
    totalBudget: 0,
    progressPercentage: 0,
  });
  const [companyStats, setCompanyStats] = useState<CompanyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const history = useHistory();
  const [isManager, setIsManager] = useState(false);
  const [userName, setUserName] = useState('Visiteur');
  const [userType, setUserType] = useState('Visiteur');
  const [isVisitor, setIsVisitor] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setIsManager(user.type_user?.toLowerCase() === 'manager');
      setUserName(user.username || 'Utilisateur');
      setUserType(user.type_user || 'Utilisateur');
      setIsVisitor(false);
    } else {
      setUserName('Visiteur');
      setUserType('Visiteur');
      setIsVisitor(true);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [signalements, statsData] = await Promise.all([
        api.getSignalements(),
        api.getStats()
      ]);
      setAlerts(signalements);
      calculateStats(signalements, statsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Signalement[], statsFromApi?: any) => {
    const totalPoints = data.length;
    const totalSurface = data.reduce((sum, alert) => sum + (Number(alert.surface) || 0), 0);
    const totalBudget = data.reduce((sum, alert) => sum + (Number(alert.budget) || 0), 0);
    
    // Utiliser l'avancement calculé par l'API (qui prend en compte nouveau=0%, en_cours=50%, terminé=100%)
    const progressPercentage = statsFromApi?.avancement || 0;

    setStats({ totalPoints, totalSurface, totalBudget, progressPercentage });

    // Calculate company statistics
    const companyMap: { [key: string]: number } = {};
    data.forEach(alert => {
      const company = alert.entreprise || 'Non assigné';
      companyMap[company] = (companyMap[company] || 0) + 1;
    });

    const companyStatsArray = Object.entries(companyMap).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / totalPoints) * 100),
    })).sort((a, b) => b.count - a.count);

    setCompanyStats(companyStatsArray);
  };

  const formatBudget = (budget: number) => {
    return budget.toLocaleString('fr-FR');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusClass = (status: string) => {
    if (!status) return 'status-new';
    const s = status.toLowerCase();
    if (s === 'termine' || s.includes('termin')) return 'status-done';
    if (s === 'en cours' || s.includes('cours')) return 'status-progress';
    return 'status-new';
  };

  const getStatusLabel = (status: string) => {
    return status || 'Nouveau';
  };

  // Generate chart data based on period
  const getChartData = () => {
    const labels = period === 'week' 
      ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
      : ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];

    // Calculer les données réelles basées sur les signalements
    const now = new Date();
    const dataPoints = period === 'week'
      ? [0, 1, 2, 3, 4, 5, 6].map(daysAgo => {
          const targetDate = new Date(now);
          targetDate.setDate(now.getDate() - (6 - daysAgo));
          targetDate.setHours(0, 0, 0, 0);
          const nextDay = new Date(targetDate);
          nextDay.setDate(targetDate.getDate() + 1);
          
          return alerts.filter(alert => {
            const alertDate = new Date(alert.date_signalement);
            return alertDate >= targetDate && alertDate < nextDay;
          }).length;
        })
      : [0, 1, 2, 3].map(weeksAgo => {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - ((3 - weeksAgo) * 7));
          weekStart.setHours(0, 0, 0, 0);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          
          return alerts.filter(alert => {
            const alertDate = new Date(alert.date_signalement);
            return alertDate >= weekStart && alertDate < weekEnd;
          }).length;
        });

    return {
      labels,
      datasets: [
        {
          label: 'Signalements',
          data: dataPoints,
          borderColor: '#2563eb',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(37, 99, 235, 0.2)');
            gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
            return gradient;
          },
          fill: true,
          tension: 0.45,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#2563eb',
          pointBorderWidth: 2,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        borderRadius: 8,
        titleColor: '#f1f5f9',
        bodyColor: '#f1f5f9',
      },
    },
    scales: {
      y: {
        display: true,
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: {
            size: 10,
            weight: '600',
          },
          color: '#94a3b8',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
            weight: '600',
          },
          color: '#94a3b8',
        },
      },
    },
  };

  const getCompanyColor = (index: number) => {
    const colors = ['#2563eb', '#4f46e5', '#16a34a'];
    return colors[index] || '#64748b';
  };

  if (loading) {
    return (
      <IonPage className="dashboard-page">
        <IonContent fullscreen>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="dashboard-page">
      <IonContent fullscreen>
        {/* NAVBAR */}
        <nav className="glass-nav">
          <div className="navbar-brand">
            Road<span className="brand-accent">Alert</span>{' '}
            <span className="brand-tag">Tana</span>
          </div>
          <div className="navbar-right">
            <div className="profile-info">
              <p className="profile-name">{userName}</p>
            </div>
            <div className="profile-avatar" style={{ background: isManager ? '#3b82f6' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={`fas ${isManager ? 'fa-user-tie' : 'fa-user'}`} style={{ color: 'white', fontSize: '20px' }}></i>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="dashboard-content">
          {/* HEADER */}
          <div className="dashboard-header">
            <div>
              <span className="header-badge">Vue d'ensemble</span>
              <h1 className="dashboard-title">Tableau de bord</h1>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {isManager && (
                <button 
                  onClick={() => history.push('/blocked-users')}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-user-shield"></i> Utilisateurs bloqués
                </button>
              )}
            </div>
          </div>

          {/* STATS GRID */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="icon-shape blue">
                <i className="fas fa-map-pin"></i>
              </div>
              <p className="stat-label">Points recensés</p>
              <div className="stat-value-row">
                <h2 className="stat-value">{stats.totalPoints}</h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="icon-shape indigo">
                <i className="fas fa-road"></i>
              </div>
              <p className="stat-label">Surface Signalée</p>
              <div className="stat-value-row">
                <h2 className="stat-value">
                  {stats.totalSurface.toLocaleString('fr-FR')}{' '}
                  <span className="stat-unit">m²</span>
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="icon-shape green">
                <i className="fas fa-wallet"></i>
              </div>
              <p className="stat-label">Budget Total</p>
              <div className="stat-value-row">
                <h2 className="stat-value">
                  {stats.totalBudget.toLocaleString('fr-FR')}{' '}
                  <span className="stat-unit">Ar</span>
                </h2>
              </div>
            </div>

            <div className="stat-card">
              <div className="icon-shape orange">
                <i className="fas fa-chart-pie"></i>
              </div>
              <p className="stat-label">Réparation Globale</p>
              <div className="progress-section">
                <div className="progress-header">
                  <span className="progress-text">{stats.progressPercentage}% terminés</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${stats.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* CHART AND COMPANIES SECTION */}
          <div className="chart-section">
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Activité des signalements</h3>
                <div className="chart-legend">
                  <span className="legend-dot"></span>
                  <span className="legend-text">Tana Ville</span>
                </div>
              </div>
              <div className="chart-container">
                <Line data={getChartData()} options={chartOptions} />
              </div>
            </div>

            <div className="companies-card">
              <h3 className="companies-title">Entreprises actives</h3>
              <div className="companies-list">
                {companyStats.slice(0, 3).map((company, index) => (
                  <div key={company.name} className="company-item">
                    <div className="company-header">
                      <span className="company-name">{company.name}</span>
                      <span className="company-percentage" style={{ color: getCompanyColor(index) }}>
                        {company.percentage}%
                      </span>
                    </div>
                    <div className="company-progress-bg">
                      <div 
                        className="company-progress-fill"
                        style={{ 
                          width: `${company.percentage}%`,
                          backgroundColor: getCompanyColor(index)
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="companies-details-btn">
                Détails des contrats
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="table-wrapper">
            <div className="table-header">
              <h3 className="table-title">Liste des points critiques</h3>
              <button className="filter-btn">
                <i className="fas fa-sliders-h"></i>
              </button>
            </div>
            <div className="table-container">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Localisation</th>
                    <th>Statut</th>
                    <th className="text-center">Surface</th>
                    <th>Budget Estimé</th>
                    <th>Entreprise</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, index) => (
                    <tr key={index}>
                      <td>
                        <div className="location-name">{alert.entreprise}</div>
                        <div className="location-date">
                          Signalé le {formatDate(alert.date_signalement)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${getStatusClass(alert.status)}`}>
                          {getStatusLabel(alert.status)}
                        </span>
                      </td>
                      <td className="text-center surface-cell">
                        {alert.surface.toLocaleString('fr-FR')} m²
                      </td>
                      <td>
                        <span className="budget-value">
                          {formatBudget(alert.budget)} Ar
                        </span>
                      </td>
                      <td className="company-cell">{alert.entreprise}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="dashboard-footer">
          {isVisitor ? (
            <div className="footer-nav" style={{ justifyContent: 'center' }}>
              <button className="footer-btn" onClick={() => history.push('/home')}>
                <i className="fas fa-map-marked-alt"></i>
              </button>
              <button className="footer-btn active">
                <i className="fas fa-chart-line"></i>
              </button>
            </div>
          ) : (
            <div className="footer-nav">
              <button className="footer-btn" onClick={() => history.push('/home')}>
                <i className="fas fa-map-marked-alt"></i>
              </button>
              <button className="footer-btn active">
                <i className="fas fa-chart-line"></i>
              </button>
              <button className="footer-btn disabled">
                <i className="fas fa-plus-circle"></i>
              </button>
              <button className="footer-btn" onClick={() => history.push('/management')}>
                <i className="fas fa-tasks"></i>
              </button>
              <button className="footer-btn" onClick={() => history.push('/blocked-users')}>
                <i className="fas fa-user-shield"></i>
              </button>
            </div>
          )}
        </footer>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;
