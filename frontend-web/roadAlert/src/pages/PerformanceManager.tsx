import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory, Link } from 'react-router-dom';
import { 
  api, 
  Task, 
  TaskStatistics, 
  PerformanceRow, 
  EntrepriseStats,
  Entreprise 
} from '../utils/api';
import './PerformanceManager.css';

type FilterType = 'all' | 'nouveau' | 'en_cours' | 'termine';

const PerformanceManager: React.FC = () => {
  const [tasks, setTasks] = useState<PerformanceRow[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<PerformanceRow[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [entrepriseStats, setEntrepriseStats] = useState<EntrepriseStats[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    titre: '',
    description: '',
    statut: 'nouveau',
    date_prevue_fin: '',
    id_entreprise: ''
  });
  const history = useHistory();
  const [user, setUser] = useState<{ username: string; type_user: string } | null>(null);

  // Vérifier les permissions au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.type_user?.toLowerCase() !== 'manager') {
      alert('⛔ Accès refusé : Cette page est réservée aux managers');
      history.push('/home');
      return;
    }
    setUser(parsedUser);
  }, [history]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTasks();
  }, [tasks, filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, statsData, entrepriseStatsData, entreprisesData] = await Promise.all([
        api.getPerformanceTable(),
        api.getTaskStatistics(),
        api.getTaskStatisticsParEntreprise(),
        api.getEntreprises()
      ]);
      setTasks(tasksData);
      setStatistics(statsData);
      setEntrepriseStats(entrepriseStatsData);
      setEntreprises(entreprisesData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setToastMessage('Erreur lors du chargement des données');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    if (filter === 'all') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(t => 
        t.statut?.toLowerCase().includes(filter.replace('_', ' '))
      ));
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await api.updateTaskStatus(taskId, newStatus);
      setToastMessage(`Statut mis à jour: ${getStatusLabel(newStatus)}`);
      setShowToast(true);
      await loadData();
    } catch (error) {
      setToastMessage('Erreur lors de la mise à jour du statut');
      setShowToast(true);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.titre) {
      setToastMessage('Le titre est obligatoire');
      setShowToast(true);
      return;
    }

    try {
      await api.createTask({
        titre: newTask.titre,
        description: newTask.description,
        statut: newTask.statut,
        date_prevue_fin: newTask.date_prevue_fin || undefined,
        id_entreprise: newTask.id_entreprise ? parseInt(newTask.id_entreprise) : undefined
      } as any);
      setToastMessage('Travail créé avec succès');
      setShowToast(true);
      setShowAddModal(false);
      setNewTask({
        titre: '',
        description: '',
        statut: 'nouveau',
        date_prevue_fin: '',
        id_entreprise: ''
      });
      await loadData();
    } catch (error) {
      setToastMessage('Erreur lors de la création');
      setShowToast(true);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce travail ?')) return;
    
    try {
      await api.deleteTask(taskId);
      setToastMessage('Travail supprimé avec succès');
      setShowToast(true);
      await loadData();
    } catch (error) {
      setToastMessage('Erreur lors de la suppression');
      setShowToast(true);
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'nouveau': return 'Nouveau';
      case 'en_cours': 
      case 'en cours': return 'En cours';
      case 'termine':
      case 'terminé': return 'Terminé';
      default: return status;
    }
  };

  const getStatusClass = (status: string): string => {
    const s = status?.toLowerCase().replace(' ', '_');
    if (s === 'termine' || s === 'terminé') return 'status-termine';
    if (s === 'en_cours' || s === 'en cours') return 'status-en_cours';
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
    if (days === null) return '-';
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
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <div className="performance-content">
          <h1 className="page-title">📊 Tableau de Performance</h1>
          <p className="page-subtitle">
            Suivi de l'avancement des travaux et analyse des délais de traitement
          </p>

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
                <div className="stat-label">Total travaux</div>
                <div className="stat-value">{statistics.total_travaux}</div>
              </div>
              <div className="stat-card success">
                <div className="stat-icon">✅</div>
                <div className="stat-label">Terminés</div>
                <div className="stat-value">{statistics.travaux_termines}</div>
              </div>
              <div className="stat-card warning">
                <div className="stat-icon">🔄</div>
                <div className="stat-label">En cours</div>
                <div className="stat-value">{statistics.travaux_en_cours}</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🆕</div>
                <div className="stat-label">Nouveaux</div>
                <div className="stat-value">{statistics.travaux_nouveaux}</div>
              </div>
              <div className="stat-card danger">
                <div className="stat-icon">⚠️</div>
                <div className="stat-label">En retard</div>
                <div className="stat-value">{statistics.travaux_en_retard}</div>
              </div>
            </div>
          )}

          {/* DÉLAIS STATISTICS */}
          {statistics && (
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
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-label">Taux de complétion</div>
                <div className="stat-value">
                  {statistics.taux_completion}
                  <span className="stat-unit">%</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: TABLEAU DES TRAVAUX */}
          <div className="section-header">
            <h2 className="section-title">📝 Liste des travaux</h2>
            <button className="add-task-btn" onClick={() => setShowAddModal(true)}>
              ➕ Nouveau travail
            </button>
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
              Nouveaux
            </button>
            <button 
              className={`filter-btn ${filter === 'en_cours' ? 'active' : ''}`}
              onClick={() => setFilter('en_cours')}
            >
              En cours
            </button>
            <button 
              className={`filter-btn ${filter === 'termine' ? 'active' : ''}`}
              onClick={() => setFilter('termine')}
            >
              Terminés
            </button>
          </div>

          {/* TABLE */}
          <div className="performance-table-container">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">Aucun travail trouvé</div>
              </div>
            ) : (
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Statut</th>
                    <th>Avancement</th>
                    <th>Date début</th>
                    <th>Date fin</th>
                    <th>Durée</th>
                    <th>Retard</th>
                    <th>Entreprise</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task.id_travaux}>
                      <td>
                        <strong>{task.titre}</strong>
                      </td>
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
                            ></div>
                          </div>
                          <span className="progress-text">{task.avancement_pourcentage}%</span>
                        </div>
                      </td>
                      <td>{formatDate(task.date_debut)}</td>
                      <td>{formatDate(task.date_fin)}</td>
                      <td>
                        <span className="duration-value">
                          {formatDuration(task.duree_jours)}
                        </span>
                      </td>
                      <td>
                        {task.date_prevue_fin && (
                          <span className={`retard-badge ${task.en_retard ? 'en-retard' : 'a-temps'}`}>
                            {task.en_retard ? '⚠️ Retard' : '✅ OK'}
                          </span>
                        )}
                      </td>
                      <td>{task.entreprise_nom || '-'}</td>
                      <td>
                        {task.statut !== 'termine' && task.statut !== 'terminé' && (
                          <select
                            className="form-select"
                            value={task.statut}
                            onChange={(e) => handleStatusChange(task.id_travaux, e.target.value)}
                            style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          >
                            <option value="nouveau">Nouveau</option>
                            <option value="en_cours">En cours</option>
                            <option value="termine">Terminé</option>
                          </select>
                        )}
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteTask(task.id_travaux)}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          🗑️
                        </button>
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
                <h2 className="section-title">🏢 Performance par entreprise</h2>
              </div>
              <div className="entreprise-stats-grid">
                {entrepriseStats.map((stat) => (
                  <div key={stat.id_entreprise} className="entreprise-card">
                    <div className="entreprise-name">{stat.entreprise_nom}</div>
                    <div className="entreprise-stats">
                      <div className="entreprise-stat">
                        <div className="entreprise-stat-value">{stat.total_travaux}</div>
                        <div className="entreprise-stat-label">Total</div>
                      </div>
                      <div className="entreprise-stat">
                        <div className="entreprise-stat-value">{stat.travaux_termines}</div>
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

        {/* MODAL: AJOUTER UN TRAVAIL */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">➕ Nouveau travail</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              </div>

              <div className="form-group">
                <label className="form-label">Titre *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTask.titre}
                  onChange={(e) => setNewTask({ ...newTask, titre: e.target.value })}
                  placeholder="Titre du travail"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Description détaillée..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Statut initial</label>
                <select
                  className="form-select"
                  value={newTask.statut}
                  onChange={(e) => setNewTask({ ...newTask, statut: e.target.value })}
                >
                  <option value="nouveau">Nouveau (0%)</option>
                  <option value="en_cours">En cours (50%)</option>
                  <option value="termine">Terminé (100%)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date prévue de fin</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newTask.date_prevue_fin}
                  onChange={(e) => setNewTask({ ...newTask, date_prevue_fin: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Entreprise</label>
                <select
                  className="form-select"
                  value={newTask.id_entreprise}
                  onChange={(e) => setNewTask({ ...newTask, id_entreprise: e.target.value })}
                >
                  <option value="">-- Sélectionner --</option>
                  {entreprises.map((e) => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
                <button className="btn-submit" onClick={handleCreateTask}>
                  Créer le travail
                </button>
              </div>
            </div>
          </div>
        )}

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
