import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api } from '../utils/api';
import './Performance.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  show: boolean;
  message: string;
  type: ToastType;
}

const ITEMS_PER_PAGE = 10;

const Performance: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [userName, setUserName] = useState('Manager');
  const [filterEntreprise, setFilterEntreprise] = useState<string>('all');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isManager, setIsManager] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const history = useHistory();

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
  };

  const getToastColor = (type: ToastType): string => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'primary';
      default: return 'medium';
    }
  };

  // Fonction pour vérifier si le token JWT est encore valide
  const isTokenValid = (token: string): boolean => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      showToast('Accès refusé en mode visiteur', 'error');
      setTimeout(() => history.push('/home'), 1500);
      setAuthChecked(true);
      return;
    }
    
    try {
      const user = JSON.parse(storedUser);
      
      // Vérifier que le token existe et est valide
      if (!user.token || !isTokenValid(user.token)) {
        localStorage.removeItem('user');
        showToast('Session expirée. Veuillez vous reconnecter.', 'error');
        setTimeout(() => history.push('/home'), 1500);
        setAuthChecked(true);
        return;
      }
      
      // Vérifier que c'est un manager
      if (user.type_user?.toLowerCase() !== 'manager') {
        showToast('Accès refusé : Cette page est réservée aux managers', 'error');
        setTimeout(() => history.push('/home'), 1500);
        setAuthChecked(true);
        return;
      }
      
      setUserName(user.username || 'Manager');
      setIsManager(true);
      setAuthChecked(true);
      loadData();
    } catch (e) {
      localStorage.removeItem('user');
      showToast('Erreur d\'authentification', 'error');
      setTimeout(() => history.push('/home'), 1500);
      setAuthChecked(true);
    }
  }, [history]);

  useIonViewWillEnter(() => {
    loadData();
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await api.getPerformance();
      setData(result);
    } catch (error: any) {
      console.error('Erreur chargement performance:', error);
      showToast(error.message || 'Erreur lors du chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuree = (jours?: number | null) => {
    if (jours === null || jours === undefined) return '—';
    if (jours === 0) return '—';
    if (jours < 1) {
      const heures = Math.round(jours * 24);
      if (heures === 0) return '< 1h';
      return `${heures}h (${jours.toFixed(2)} jour${jours > 1 ? 's' : ''})`;
    }
    const joursEntiers = Math.floor(jours);
    const heuresRestantes = Math.round((jours - joursEntiers) * 24);
    if (heuresRestantes > 0) {
      return `${jours.toFixed(1)} jour${jours > 1 ? 's' : ''} (${joursEntiers}j ${heuresRestantes}h)`;
    }
    return `${jours.toFixed(1)} jour${jours > 1 ? 's' : ''}`;
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000) return `${(budget / 1000000).toFixed(1)}M`;
    if (budget >= 1000) return `${(budget / 1000).toFixed(0)}K`;
    return budget.toLocaleString('fr-FR');
  };

  const getStatusClass = (code: string) => {
    switch (code) {
      case 'termine': return 'status-termine';
      case 'en_cours': return 'status-en-cours';
      default: return 'status-nouveau';
    }
  };

  const getStatusLabel = (code: string) => {
    switch (code) {
      case 'termine': return 'Terminé';
      case 'en_cours': return 'En cours';
      default: return 'Nouveau';
    }
  };

  const getAvancementColor = (pct: number) => {
    if (pct === 100) return '#10b981';
    if (pct >= 50) return '#f59e0b';
    return '#ef4444';
  };

  // Filtrer les signalements dynamiquement
  const filteredSignalements = data?.signalements?.filter((s: any) => {
    const matchEntreprise = filterEntreprise === 'all' || s.entreprise_nom === filterEntreprise;
    const matchStatut = filterStatut === 'all' || s.statut_code === filterStatut;
    return matchEntreprise && matchStatut;
  }) || [];

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterEntreprise, filterStatut]);

  // Paginated signalements
  const paginatedSignalements = filteredSignalements.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Extraire dynamiquement les entreprises et statuts uniques
  const uniqueEntreprises = Array.from(new Set((data?.signalements || []).map((s: any) => s.entreprise_nom).filter(Boolean))) as string[];
  const uniqueStatuts = Array.from(new Set((data?.signalements || []).map((s: any) => s.statut_code).filter(Boolean))) as string[];

  // Afficher un loader ou rien tant que l'auth n'est pas vérifiée ou si pas manager
  if (!authChecked || !isManager) {
    return (
      <IonPage className="performance-page">
        <IonContent fullscreen>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
          <IonToast
            isOpen={toast.show}
            onDidDismiss={() => setToast({ ...toast, show: false })}
            message={toast.message}
            duration={3000}
            position="top"
            color={getToastColor(toast.type)}
            cssClass="custom-toast"
          />
        </IonContent>
      </IonPage>
    );
  }

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
            <span className="manager-badge">Manager</span>
          </div>
          <div className="navbar-right">
            <div className="profile-info">
              <p className="profile-name">{userName}</p>
            </div>
            <div className="profile-avatar">
              <i className="fas fa-user-tie"></i>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="performance-content">
          {/* HEADER */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Performance & Délais</h1>
              <p className="page-subtitle">Suivi de l'avancement et des délais de traitement des travaux</p>
            </div>
          </div>

          {/* STATS GLOBALES */}
          {data?.stats && (
            <div className="stats-grid">
              <div className="perf-stat-card">
                <div className="perf-stat-icon blue">
                  <i className="fas fa-flag"></i>
                </div>
                <div className="perf-stat-info">
                  <p className="perf-stat-label">Total signalements</p>
                  <p className="perf-stat-value">{data.stats.total_signalements}</p>
                </div>
              </div>
              <div className="perf-stat-card">
                <div className="perf-stat-icon green">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="perf-stat-info">
                  <p className="perf-stat-label">Terminés</p>
                  <p className="perf-stat-value">{data.stats.signalements_termines}</p>
                </div>
              </div>
              <div className="perf-stat-card">
                <div className="perf-stat-icon orange">
                  <i className="fas fa-spinner"></i>
                </div>
                <div className="perf-stat-info">
                  <p className="perf-stat-label">En cours</p>
                  <p className="perf-stat-value">{data.stats.signalements_en_cours}</p>
                </div>
              </div>
              <div className="perf-stat-card">
                <div className="perf-stat-icon red">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <div className="perf-stat-info">
                  <p className="perf-stat-label">Nouveaux</p>
                  <p className="perf-stat-value">{data.stats.signalements_nouveaux}</p>
                </div>
              </div>
            </div>
          )}

          {/* AVANCEMENT GLOBAL + DELAIS */}
          {data?.stats && (
            <div className="overview-grid">
              <div className="overview-card">
                <h3 className="card-title"><i className="fas fa-chart-pie"></i> Avancement Global</h3>
                <div className="avancement-global">
                  <div className="avancement-circle">
                    <svg viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={getAvancementColor(data.stats.avancement_moyen)}
                        strokeWidth="10"
                        strokeDasharray={`${(data.stats.avancement_moyen / 100) * 314} 314`}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <span className="avancement-text">{Math.round(data.stats.avancement_moyen)}%</span>
                  </div>
                  <div className="avancement-legend">
                    <div className="legend-item">
                      <span className="legend-dot red"></span>
                      <span>Nouveau = 0%</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot orange"></span>
                      <span>En cours = 50%</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot green"></span>
                      <span>Terminé = 100%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <h3 className="card-title"><i className="fas fa-clock"></i> Délais moyens de traitement</h3>
                <div className="delais-grid">
                  <div className="delai-item">
                    <p className="delai-label">Nouveau → En cours</p>
                    <p className="delai-sublabel">Délai moyen de prise en charge</p>
                    <p className="delai-value blue">{formatDuree(data.stats.delai_moyen_nouveau_encours)}</p>
                  </div>
                  <div className="delai-item">
                    <p className="delai-label">En cours → Terminé</p>
                    <p className="delai-sublabel">Délai moyen des travaux</p>
                    <p className="delai-value orange">{formatDuree(data.stats.delai_moyen_encours_termine)}</p>
                  </div>
                  <div className="delai-item">
                    <p className="delai-label">Nouveau → Terminé</p>
                    <p className="delai-sublabel">Délai moyen total</p>
                    <p className="delai-value green">{formatDuree(data.stats.delai_moyen_nouveau_termine)}</p>
                  </div>
                  <div className="delai-item">
                    <p className="delai-label">Budget total</p>
                    <p className="delai-sublabel">Montant alloué</p>
                    <p className="delai-value">{formatBudget(data.stats.budget_total)} Ar</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATS PAR ENTREPRISE */}
          {data?.entreprises && data.entreprises.length > 0 && (
            <div className="section-card">
              <h3 className="card-title"><i className="fas fa-building"></i> Performance par entreprise</h3>
              <div className="entreprise-table-container">
                <table className="perf-table">
                  <thead>
                    <tr>
                      <th>Entreprise</th>
                      <th className="text-center">Signalements</th>
                      <th className="text-center">Terminés</th>
                      <th className="text-center">Avancement</th>
                      <th className="text-center">Budget</th>
                      <th className="text-center">Délai moyen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entreprises.map((ent: any) => (
                      <tr key={ent.entreprise_id}>
                        <td className="entreprise-name">{ent.entreprise_nom}</td>
                        <td className="text-center">{ent.total_signalements}</td>
                        <td className="text-center">{ent.signalements_termines}</td>
                        <td className="text-center">
                          <div className="mini-progress">
                            <div className="mini-progress-bar" style={{ width: `${ent.avancement_moyen}%`, backgroundColor: getAvancementColor(ent.avancement_moyen) }}></div>
                          </div>
                          <span className="mini-pct">{Math.round(ent.avancement_moyen)}%</span>
                        </td>
                        <td className="text-center budget-cell">{formatBudget(ent.budget_total)} Ar</td>
                        <td className="text-center">{formatDuree(ent.delai_moyen_jours)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLEAU DÉTAILLÉ DES SIGNALEMENTS */}
          <div className="section-card">
            <div className="card-header-row">
              <h3 className="card-title"><i className="fas fa-list-alt"></i> Détail des signalements</h3>
              <div className="filters-row">
                <select value={filterEntreprise} onChange={(e) => setFilterEntreprise(e.target.value)}>
                  <option value="all">Toutes les entreprises</option>
                  {uniqueEntreprises.map(e => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  {uniqueStatuts.map(s => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="entreprise-table-container">
              <table className="perf-table detail-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Entreprise</th>
                    <th className="text-center">Statut</th>
                    <th className="text-center">Avancement</th>
                    <th>Date signalement</th>
                    <th>Début travaux</th>
                    <th>Fin travaux</th>
                    <th className="text-center">Nouveau → En cours</th>
                    <th className="text-center">En cours → Terminé</th>
                    <th className="text-center">Total</th>
                    <th className="text-center">Surface</th>
                    <th className="text-center">Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignalements.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="empty-row">Aucun signalement trouvé</td>
                    </tr>
                  ) : (
                    paginatedSignalements.map((s: any) => (
                      <tr key={s.id}>
                        <td className="id-cell">{s.id}</td>
                        <td className="entreprise-name">{s.entreprise_nom || '—'}</td>
                        <td className="text-center">
                          <span className={`status-pill ${getStatusClass(s.statut_code)}`}>
                            {getStatusLabel(s.statut_code)}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="mini-progress">
                            <div className="mini-progress-bar" style={{ width: `${s.avancement}%`, backgroundColor: getAvancementColor(s.avancement) }}></div>
                          </div>
                          <span className="mini-pct">{s.avancement}%</span>
                        </td>
                        <td>{formatDate(s.date_signalement)}</td>
                        <td>{formatDate(s.date_debut)}</td>
                        <td>{formatDate(s.date_fin)}</td>
                        <td className="text-center">{formatDuree(s.delai_nouveau_encours_jours)}</td>
                        <td className="text-center">{formatDuree(s.delai_encours_termine_jours)}</td>
                        <td className="text-center">{formatDuree(s.delai_nouveau_termine_jours)}</td>
                        <td className="text-center">{s.surface.toLocaleString('fr-FR')} m²</td>
                        <td className="text-center budget-cell">{formatBudget(s.budget)} Ar</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PAGINATION */}
          {filteredSignalements.length > ITEMS_PER_PAGE && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="pagination-info">
                Page {currentPage} / {Math.ceil(filteredSignalements.length / ITEMS_PER_PAGE)}
                <span className="pagination-total">({filteredSignalements.length} éléments)</span>
              </div>
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSignalements.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(filteredSignalements.length / ITEMS_PER_PAGE)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </main>

        {/* FOOTER NAV */}
        <footer className="performance-footer">
          <div className="footer-nav">
            <button className="footer-btn" onClick={() => history.push('/home')}>
              <i className="fas fa-map-marked-alt"></i>
            </button>
            <button className="footer-btn" onClick={() => history.push('/dashboard')}>
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
            <button className="footer-btn" onClick={() => history.push('/users-list')}>
              <i className="fas fa-users-cog"></i>
            </button>
            <button className="footer-btn active">
              <i className="fas fa-tachometer-alt"></i>
            </button>
          </div>
        </footer>

        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          message={toast.message}
          duration={3000}
          position="top"
          color={getToastColor(toast.type)}
          cssClass="custom-toast"
        />
      </IonContent>
    </IonPage>
  );
};

export default Performance;
