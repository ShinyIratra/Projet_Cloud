import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api, Signalement } from '../utils/api';
import './Management.css';

type FilterType = 'all' | 'new' | 'progress';
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  show: boolean;
  message: string;
  type: ToastType;
}

const Management: React.FC = () => {
  const [alerts, setAlerts] = useState<Signalement[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingAlert, setEditingAlert] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Signalement>>({});
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSignalement, setNewSignalement] = useState<Partial<Signalement>>({
    surface: undefined,
    budget: undefined,
    lattitude: undefined,
    longitude: undefined,
    entreprise: '',
    status: 'nouveau'
  });
  const [entreprises, setEntreprises] = useState<{id: number, nom: string}[]>([]);
  const history = useHistory();

  // Helper pour afficher les toasts
  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
  };

  // Mapping couleurs pour les toasts
  const getToastColor = (type: ToastType): string => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'primary';
      default: return 'medium';
    }
  };

  // Vérifier les permissions au chargement
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.type_user?.toLowerCase() !== 'manager') {
      showToast('Accès refusé : Cette page est réservée aux managers', 'error');
      setTimeout(() => history.push('/home'), 2000);
      return;
    }
  }, [history]);

  useEffect(() => {
    loadAlerts();
    loadEntreprises();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filter]);

  const loadEntreprises = async () => {
    try {
      const data = await api.getEntreprises();
      setEntreprises(data);
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await api.getSignalements();
      setAlerts(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      showToast('Erreur lors du chargement des signalements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;
    if (filter === 'new') {
      filtered = alerts.filter(a => !a.status || a.status?.toLowerCase().includes('nouveau'));
    } else if (filter === 'progress') {
      filtered = alerts.filter(a => a.status?.toLowerCase().includes('cours'));
    }
    setFilteredAlerts(filtered);
  };

  const handleStatusChange = async (alertId: number, newStatus: string) => {
    try {
      const statusCode = newStatus === 'En cours' ? 'en_cours' : 'termine';
      await api.updateStatus(alertId, statusCode);
      
      if (newStatus === 'En cours') {
        showToast(' Les travaux ont démarré !', 'info');
      } else {
        showToast(' Signalement marqué comme terminé !', 'success');
      }
      await loadAlerts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour du statut', 'error');
    }
  };

  const startEditing = (alert: Signalement) => {
    setEditingAlert(alert.id);
    setEditForm(alert);
  };

  const cancelEditing = () => {
    setEditingAlert(null);
    setEditForm({});
  };

  const saveChanges = async () => {
    if (!editingAlert || !editForm.id) {
      showToast('Données invalides', 'error');
      return;
    }
    
    try {
      await api.updateSignalement(editForm.id, editForm);
      showToast(' Signalement mis à jour avec succès !', 'success');
      setEditingAlert(null);
      setEditForm({});
      await loadAlerts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const createSignalement = async () => {
    try {
      // Validation des champs
      if (!newSignalement.surface || newSignalement.surface <= 0) {
        showToast('⚠️ La surface doit être supérieure à 0', 'warning');
        return;
      }

      if (!newSignalement.lattitude || !newSignalement.longitude) {
        showToast('⚠️ Veuillez renseigner les coordonnées GPS', 'warning');
        return;
      }

      // Vérifier que les coordonnées sont valides (Madagascar approximativement)
      if (newSignalement.lattitude < -26 || newSignalement.lattitude > -11 || 
          newSignalement.longitude < 43 || newSignalement.longitude > 51) {
        showToast('⚠️ Les coordonnées semblent incorrectes pour Madagascar', 'warning');
      }

      // Récupérer l'utilisateur connecté
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        showToast('❌ Session expirée, veuillez vous reconnecter', 'error');
        history.push('/login');
        return;
      }
      const user = JSON.parse(storedUser);
      
      // Ajouter l'userId au signalement
      const signalementData = {
        ...newSignalement,
        userId: user.id,
        budget: newSignalement.budget || 0
      };

      await api.createSignalement(signalementData as any);
      showToast('🎉 Signalement créé avec succès !', 'success');
      setShowAddModal(false);
      setNewSignalement({
        surface: undefined,
        budget: undefined,
        lattitude: undefined,
        longitude: undefined,
        entreprise: '',
        status: 'nouveau'
      });
      await loadAlerts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création du signalement', 'error');
    }
  };

  const getStatusClass = (status: string) => {
    if (!status) return 'status-new';
    const s = status.toLowerCase();
    if (s === 'termine' || s.includes('termin')) return 'status-done';
    if (s === 'en cours' || s.includes('cours')) return 'status-progress';
    return 'status-new';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <IonPage className="management-page">
        <IonContent fullscreen>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="management-page">
      <IonContent fullscreen>
        {/* NAVBAR */}
        <nav className="glass-nav">
          <div className="navbar-left">
            <div className="navbar-brand">
              Road<span className="brand-accent">Alert</span>
            </div>
            <span className="manager-badge">Console Manager</span>
          </div>
          <div className="navbar-right">
            <div className="profile-info">
              <p className="profile-label">Connecté en tant que</p>
              <p className="profile-name">Manager</p>
            </div>
            <div className="profile-avatar" style={{ background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-user-tie" style={{ color: 'white', fontSize: '20px' }}></i>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="management-content">
          {/* HEADER */}
          <div className="management-header">
            <div>
              <h1 className="page-title">Gestion des interventions</h1>
              <p className="page-subtitle">
                Modifiez le statut des signalements et assignez les entreprises de travaux.
              </p>
            </div>
            <button className="btn-add-alert" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-plus"></i> Ajouter un signalement
            </button>
          </div>

          {/* FILTERS */}
          <div className="filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tous les signalements ({alerts.length})
            </button>
            <button
              className={`filter-btn ${filter === 'new' ? 'active' : ''}`}
              onClick={() => setFilter('new')}
            >
              À valider
            </button>
            <button
              className={`filter-btn ${filter === 'progress' ? 'active' : ''}`}
              onClick={() => setFilter('progress')}
            >
              En cours
            </button>
          </div>

          {/* CARDS LIST */}
          <div className="cards-list">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="action-card">
                {editingAlert === alert.id ? (
                  // EDIT MODE
                  <div className="edit-mode">
                    <div className="edit-header">
                      <h3 className="edit-title">Modifier le signalement</h3>
                      <button className="close-btn" onClick={cancelEditing}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <div className="edit-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Surface (m²)</label>
                          <input
                            type="number"
                            placeholder="Surface en m²"
                            value={editForm.surface || ''}
                            onChange={(e) => setEditForm({ ...editForm, surface: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Budget (Ar)</label>
                          <input
                            type="number"
                            placeholder="Budget en Ariary"
                            value={editForm.budget || ''}
                            onChange={(e) => setEditForm({ ...editForm, budget: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Entreprise concernée</label>
                        <select
                          value={editForm.entreprise || ''}
                          onChange={(e) => setEditForm({ ...editForm, entreprise: e.target.value })}
                        >
                          <option value="">Sélectionner une entreprise</option>
                          {entreprises.map((ent) => (
                            <option key={ent.id} value={ent.nom}>{ent.nom}</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Ex: -18.9138"
                            value={editForm.lattitude || ''}
                            onChange={(e) => setEditForm({ ...editForm, lattitude: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="Ex: 47.5361"
                            value={editForm.longitude || ''}
                            onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value ? Number(e.target.value) : undefined })}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className="btn-cancel" onClick={cancelEditing}>
                          Annuler
                        </button>
                        <button className="btn-save" onClick={saveChanges}>
                          <i className="fas fa-save"></i> Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE
                  <div className="card-content">
                    <div className="card-left">
                      <div className="card-image">
                        <div className="image-placeholder">
                          <i className="fas fa-road"></i>
                        </div>
                      </div>
                      <div className="card-info">
                        <span className={`status-pill ${getStatusClass(alert.status || '')}`}>
                          {alert.status}
                        </span>
                        <h3 className="alert-title">{alert.entreprise || 'Non assigné'}</h3>
                        <p className="alert-location">
                          <i className="fas fa-map-marker-alt"></i> Coordonnées : {alert.lattitude}, {alert.longitude}
                        </p>
                        <div className="alert-meta">
                          <div className="meta-item">
                            Signalé le : <span>{formatDate(alert.date_signalement)}</span>
                          </div>
                          <div className="meta-item border">
                            Surface : <span>{alert.surface.toLocaleString('fr-FR')} m²</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card-right">
                      <div className="controls-section">
                        <p className="controls-title">Mettre à jour le statut</p>
                        <div className="status-buttons">
                          <button
                            className="status-btn progress"
                            onClick={() => handleStatusChange(alert.id, 'En cours')}
                          >
                            <i className="fas fa-hammer"></i>
                            <span>Lancer</span>
                          </button>
                          <button
                            className="status-btn done"
                            onClick={() => handleStatusChange(alert.id, 'Terminé')}
                          >
                            <i className="fas fa-check-circle"></i>
                            <span>Terminer</span>
                          </button>
                        </div>
                        <button className="btn-edit" onClick={() => startEditing(alert)}>
                          <i className="fas fa-edit"></i> Modifier les détails
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        {/* MODAL D'AJOUT */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Nouveau signalement</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Surface (m²) *</label>
                    <input
                      type="number"
                      placeholder="Surface en m²"
                      value={newSignalement.surface || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, surface: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Budget (Ar) *</label>
                    <input
                      type="number"
                      placeholder="Budget en Ariary"
                      value={newSignalement.budget || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, budget: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Entreprise concernée</label>
                  <select
                    value={newSignalement.entreprise || ''}
                    onChange={(e) => setNewSignalement({ ...newSignalement, entreprise: e.target.value })}
                  >
                    <option value="">Sélectionner une entreprise</option>
                    {entreprises.map((ent) => (
                      <option key={ent.id} value={ent.nom}>{ent.nom}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Latitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Ex: -18.9138"
                      value={newSignalement.lattitude || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, lattitude: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude *</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Ex: 47.5361"
                      value={newSignalement.longitude || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, longitude: e.target.value ? Number(e.target.value) : undefined })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
                <button className="btn-save" onClick={createSignalement}>
                  <i className="fas fa-save"></i> Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className="management-footer">
          <div className="footer-nav">
            <button className="footer-btn" onClick={() => history.push('/home')}>
              <i className="fas fa-home"></i>
            </button>
            <button className="footer-btn" onClick={() => history.push('/dashboard')}>
              <i className="fas fa-chart-bar"></i>
            </button>
            <button className="footer-btn" onClick={() => setShowAddModal(true)}>
              <i className="fas fa-plus-circle"></i>
            </button>
            <button className="footer-btn active">
              <i className="fas fa-tasks"></i>
            </button>
            <button className="footer-btn" onClick={() => history.push('/blocked-users')}>
              <i className="fas fa-user-shield"></i>
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

export default Management;
