import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import { 
  api, 
  TaskStatistics, 
  PerformanceRow, 
  EntrepriseStats
} from '../utils/api';
import './PerformanceManager.css';

type FilterType = 'all' | 'nouveau' | 'en_cours' | 'termine';

const PerformanceManager: React.FC = () => {
  const [tasks, setTasks] = useState<PerformanceRow[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<PerformanceRow[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [entrepriseStats, setEntrepriseStats] = useState<EntrepriseStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();
  const [user, setUser] = useState<{ username: string; type_user: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Vérifier les permissions au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.type_user?.toLowerCase() !== 'manager') {
      alert('Accès refusé : Cette page est réservée aux managers');
      history.push('/home');
      return;
    }
    setUser(parsedUser);
  }, [history]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(t => t.statut === filter));
    }
  }, [tasks, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, statsData, entrepriseStatsData] = await Promise.all([
        api.getPerformanceTable(),
        api.getTaskStatistics(),
        api.getTaskStatisticsParEntreprise()
      ]);
      setTasks(tasksData);
      setStatistics(statsData);
      setEntrepriseStats(entrepriseStatsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setToastMessage('Erreur lors du chargement des données');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };



  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      setToastMessage(`Statut mis à jour → ${getStatusLabel(newStatus)} (${getStatusPourcentage(newStatus)}%)`);
      setShowToast(true);
      await loadData();
    } catch {
      setToastMessage('Erreur lors de la mise à jour du statut');
      setShowToast(true);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': return 'En cours';
      case 'termine': return 'Terminé';
      default: return status;
    }
  };

  const getStatusPourcentage = (status: string): number => {
    switch (status?.toLowerCase()) {
      case 'nouveau': return 0;
      case 'en_cours': return 50;
      case 'termine': return 100;
      default: return 0;
    }
  };

  const getStatusClass = (status: string): string => {
    if (status === 'termine') return 'status-termine';
    if (status === 'en_cours') return 'status-en_cours';
    return 'status-nouveau';
  };

  const getProgressClass = (percentage: number): string => {
    if (percentage >= 100) return 'progress-100';
    if (percentage >= 50) return 'progress-50';
    return 'progress-0';
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const formatDuration = (days: number | null): string => {
    if (days === null || days === undefined) return '-';
    if (days < 1) return `${Math.round(days * 24)}h`;
    return `${days.toFixed(1)}j`;
  };

  if (loading) {
    return (
      <IonPage className="performance-page">
        <IonContent fullscreen>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="performance-page">
      <IonContent fullscreen>
        {/* NAVBAR */}
        <nav className="glass-nav">
          <div className="navbar-left">
            <div className="navbar-brand">
              Road<span className="brand-accent">Alert</span>
            </div>
            <span className="manager-badge">Performance Manager</span>
          </div>
          <div className="nav-links">
            <Link to="/home" className="nav-link">Dashboard</Link>
            <Link to="/management" className="nav-link">Signalements</Link>
            <Link to="/performance" className="nav-link active">Performance</Link>
          </div>
          <div className="navbar-right">
            <div className="profile-info">
              <div className="profile-label">Connecté en tant que</div>
              <div className="profile-name">{user?.username || 'Manager'}</div>
            </div>
            <div style={{ position: 'relative' }}>
              <div 
                className="profile-avatar" 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '40px', height: '40px', borderRadius: '50%' }}
              >
                <i className="fas fa-user-tie" style={{ color: 'white', fontSize: '18px' }}></i>
              </div>
              {showUserMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    padding: '8px',
                    minWidth: '200px',
                    zIndex: 1000
                  }}
                >
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/home'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-map-marked-alt"></i> Carte
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/dashboard'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-chart-pie"></i> Dashboard
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/management'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-cog"></i> Gestion
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/blocked-users'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-user-shield"></i> Utilisateurs bloqués
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/users-list'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-users"></i> Tous les utilisateurs
                  </button>
                  <button 
                    onClick={() => { localStorage.removeItem('user'); setShowUserMenu(false); history.push('/login'); }}
                    style={{ width: '100%', padding: '10px 12px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: '#dc2626', borderRadius: '8px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-sign-out-alt"></i> Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <div className="performance-content">
          <h1 className="page-title">Tableau de Performance</h1>
          <p className="page-subtitle">
            Suivi automatique de l'avancement des signalements et analyse des délais de traitement
          </p>

          {/* RÈGLES D'AVANCEMENT */}
          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-card" style={{ border: '2px solid #e2e8f0' }}>
              <div className="stat-icon">🆕</div>
              <div className="stat-label">Nouveau</div>
              <div className="stat-value">0<span className="stat-unit">%</span></div>
            </div>
            <div className="stat-card" style={{ border: '2px solid #f59e0b' }}>
              <div className="stat-icon">🔄</div>
              <div className="stat-label">En cours</div>
              <div className="stat-value">50<span className="stat-unit">%</span></div>
            </div>
            <div className="stat-card" style={{ border: '2px solid #10b981' }}>
              <div className="stat-icon">✅</div>
              <div className="stat-label">Terminé</div>
              <div className="stat-value">100<span className="stat-unit">%</span></div>
            </div>
          </div>

          {/* STATS CARDS */}
          {statistics && (
            <div className="stats-grid">
              <div className="stat-card highlight">
                <div className="stat-icon">📈</div>
                <div className="stat-label">Avancement moyen</div>
                <div className="stat-value">
                  {statistics.avancement_moyen}
                  <span className="stat-unit">%</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-label">Total signalements</div>
                <div className="stat-value">{statistics.total_signalements}</div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-label">Terminés</div>
                <div className="stat-value">{statistics.signalements_termines}</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">🔄</div>
                <div className="stat-label">En cours</div>
                <div className="stat-value">{statistics.signalements_en_cours}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🆕</div>
                <div className="stat-label">Nouveaux</div>
                <div className="stat-value">{statistics.signalements_nouveaux}</div>
              </div>
              <div className="stat-card highlight">
                <div className="stat-icon">🎯</div>
                <div className="stat-label">Taux de complétion</div>
                <div className="stat-value">
                  {statistics.taux_completion}
                  <span className="stat-unit">%</span>
                </div>
              </div>
            </div>
          )}

          {/* DÉLAIS STATISTICS */}
          {statistics && (
            <>
              <div className="section-header">
                <h2 className="section-title">Statistiques des délais de traitement</h2>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">⏱️</div>
                  <div className="stat-label">Délai moyen</div>
                  <div className="stat-value">
                    {statistics.delai_moyen_jours !== null 
                      ? statistics.delai_moyen_jours.toFixed(1) 
                      : '-'}
                    <span className="stat-unit">jours</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🚀</div>
                  <div className="stat-label">Délai minimum</div>
                  <div className="stat-value">
                    {statistics.delai_min_jours !== null 
                      ? statistics.delai_min_jours.toFixed(1) 
                      : '-'}
                    <span className="stat-unit">jours</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🐢</div>
                  <div className="stat-label">Délai maximum</div>
                  <div className="stat-value">
                    {statistics.delai_max_jours !== null 
                      ? statistics.delai_max_jours.toFixed(1) 
                      : '-'}
                    <span className="stat-unit">jours</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* SECTION: TABLEAU DES SIGNALEMENTS AVEC AVANCEMENT */}
          <div className="section-header">
            <h2 className="section-title">Suivi d'avancement des signalements</h2>
          </div>

          {/* FILTERS */}
          <div className="filters-bar">
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous ({tasks.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'nouveau' ? 'active' : ''}`}
              onClick={() => setFilter('nouveau')}
            >
              Nouveaux (0%)
            </button>
            <button 
              className={`filter-btn ${filter === 'en_cours' ? 'active' : ''}`}
              onClick={() => setFilter('en_cours')}
            >
              En cours (50%)
            </button>
            <button 
              className={`filter-btn ${filter === 'termine' ? 'active' : ''}`}
              onClick={() => setFilter('termine')}
            >
              Terminés (100%)
            </button>
          </div>

          {/* TABLE */}
          <div className="performance-table-container">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">Aucun signalement trouvé</div>
              </div>
            ) : (
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Statut</th>
                    <th>Avancement</th>
                    <th>Date début</th>
                    <th>Date mise à jour</th>
                    <th>Date fin</th>
                    <th>Durée traitement</th>
                    <th>Surface</th>
                    <th>Budget</th>
                    <th>Entreprise</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id}>
                      <td><strong>#{task.id}</strong></td>
                      <td>{task.titre || '-'}</td>
                      <td>
                        <span className={`status-badge ${getStatusClass(task.statut)}`}>
                          {getStatusLabel(task.statut)}
                        </span>
                      </td>
                      <td>
                        <div className="progress-cell">
                          <div className="progress-bar-container">
                            <div 
                              className={`progress-bar-fill ${getProgressClass(task.avancement_pourcentage)}`}
                              style={{ width: `${task.avancement_pourcentage}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{task.avancement_pourcentage}%</span>
                        </div>
                      </td>
                      <td>{formatDate(task.date_signalement)}</td>
                      <td>{formatDate(task.date_mise_a_jour)}</td>
                      <td>{formatDate(task.date_fin)}</td>
                      <td>
                        <span className="duration-value">
                          {formatDuration(task.duree_jours)}
                        </span>
                      </td>
                      <td>{task.surface} m²</td>
                      <td>{task.budget?.toLocaleString('fr-FR')} Ar</td>
                      <td>{task.entreprise_nom || '-'}</td>
                      <td>
                        {task.statut !== 'termine' && (
                          <select
                            className="form-select"
                            value={task.statut}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <option value="nouveau">Nouveau (0%)</option>
                            <option value="en_cours">En cours (50%)</option>
                            <option value="termine">Terminé (100%)</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* SECTION: STATS PAR ENTREPRISE */}
          {entrepriseStats.length > 0 && (
            <>
              <div className="section-header">
                <h2 className="section-title">Performance par entreprise</h2>
              </div>
              <div className="entreprise-stats-grid">
                {entrepriseStats.map((stat) => (
                  <div key={stat.id_entreprise} className="entreprise-card">
                    <div className="entreprise-name">{stat.entreprise_nom}</div>
                    <div className="entreprise-stats">
                      <div className="entreprise-stat">
                        <div className="entreprise-stat-value">{stat.total_signalements}</div>
                        <div className="entreprise-stat-label">Total</div>
                      </div>
                      <div className="entreprise-stat">
                        <div className="entreprise-stat-value">{stat.signalements_termines}</div>
                        <div className="entreprise-stat-label">Terminés</div>
                      </div>
                      <div className="entreprise-stat">
                        <div className="entreprise-stat-value">{stat.avancement_moyen || 0}%</div>
                        <div className="entreprise-stat-label">Avancement</div>
                      </div>
                      <div className="entreprise-stat">
                        <div className="entreprise-stat-value">
                          {stat.delai_moyen_jours !== null ? `${stat.delai_moyen_jours}j` : '-'}
                        </div>
                        <div className="entreprise-stat-label">Délai moy.</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* TOAST */}
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />
      </IonContent>
    </IonPage>
  );
};

export default PerformanceManager;
