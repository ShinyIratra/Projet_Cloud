import { useEffect, useState, useRef } from 'react';
import { IonContent, IonPage, IonToast, useIonViewWillEnter } from '@ionic/react';
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

const ITEMS_PER_PAGE = 10;

const Management: React.FC = () => {
  const [alerts, setAlerts] = useState<Signalement[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [currentPage, setCurrentPage] = useState(1);
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
  const [userName, setUserName] = useState('Manager');
  // State pour le mode "terminer" avec confirmation
  const [finishingAlert, setFinishingAlert] = useState<number | null>(null);
  const [finishDate, setFinishDate] = useState<string>('');
  // State pour le mode "lancer" avec confirmation  
  const [launchingAlert, setLaunchingAlert] = useState<number | null>(null);
  const [launchDate, setLaunchDate] = useState<string>('');
  const history = useHistory();

  // Refs for add modal keyboard navigation
  const addSurfaceRef = useRef<HTMLInputElement>(null);
  const addBudgetRef = useRef<HTMLInputElement>(null);
  const addEntrepriseRef = useRef<HTMLSelectElement>(null);
  const addLatRef = useRef<HTMLInputElement>(null);
  const addLongRef = useRef<HTMLInputElement>(null);
  const addSubmitRef = useRef<HTMLButtonElement>(null);

  // Refs for edit form keyboard navigation
  const editSurfaceRef = useRef<HTMLInputElement>(null);
  const editBudgetRef = useRef<HTMLInputElement>(null);
  const editEntrepriseRef = useRef<HTMLSelectElement>(null);
  const editLatRef = useRef<HTMLInputElement>(null);
  const editLongRef = useRef<HTMLInputElement>(null);
  const editSubmitRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => addSurfaceRef.current?.focus(), 100);
    }
  }, [showAddModal]);

  // Auto-focus first input when editing
  useEffect(() => {
    if (editingAlert !== null) {
      setTimeout(() => editSurfaceRef.current?.focus(), 100);
    }
  }, [editingAlert]);

  // Handle keyboard navigation
  const handleKeyNav = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null> | null, submitFn?: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else if (submitFn) {
        submitFn();
      }
    }
  };

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
    setUserName(user.username || 'Manager');
  }, [history]);

  useEffect(() => {
    loadAlerts();
    loadEntreprises();
  }, []);

  useEffect(() => {
    filterAlerts();
    setCurrentPage(1); // Reset page when filter changes
  }, [alerts, filter]);

  // Recharger les données chaque fois qu'on revient sur cette page
  useIonViewWillEnter(() => {
    loadAlerts();
  });

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

  // Activer le mode "terminer" : affiche date input + zone de confirmation
  const activateFinishMode = (alertId: number) => {
    if (finishingAlert === alertId) return;
    setFinishingAlert(alertId);
    setFinishDate(new Date().toISOString().split('T')[0]);
  };

  // Confirmer la fin des travaux
  const confirmFinish = async (alertId: number) => {
    if (!finishDate) {
      showToast('Veuillez sélectionner une date de fin.', 'warning');
      return;
    }
    try {
      await api.updateStatus(alertId, 'termine');
      showToast('Signalement marqué comme terminé !', 'success');
      setFinishingAlert(null);
      setFinishDate('');
      await loadAlerts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour du statut', 'error');
    }
  };

  // Activer le mode "lancer" avec confirmation
  const activateLaunchMode = (alertId: number) => {
    if (launchingAlert === alertId) return;
    setLaunchingAlert(alertId);
    setLaunchDate(new Date().toISOString().split('T')[0]);
  };

  // Annuler le mode lancement
  const cancelLaunchMode = () => {
    setLaunchingAlert(null);
    setLaunchDate('');
  };

  // Annuler le mode finish
  const cancelFinishMode = () => {
    setFinishingAlert(null);
    setFinishDate('');
  };

  // Confirmer le lancement des travaux
  const confirmLaunch = async (alertId: number) => {
    try {
      await api.updateStatus(alertId, 'en_cours');
      showToast('Les travaux ont démarré !', 'info');
      setLaunchingAlert(null);
      await loadAlerts();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la mise à jour du statut', 'error');
    }
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
      // Exclure status, status_code, date_signalement, updated_at, date_debut, date_fin pour éviter l'erreur de statut invalide
      const { status, status_code, date_signalement, updated_at, date_debut, date_fin, ...updateData } = editForm;
      await api.updateSignalement(editForm.id, updateData as Partial<Signalement>);
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
        showToast(' La surface doit être supérieure à 0', 'warning');
        return;
      }

      if (!newSignalement.lattitude || !newSignalement.longitude) {
        showToast(' Veuillez renseigner les coordonnées GPS', 'warning');
        return;
      }

      // Vérifier que les coordonnées sont valides (Madagascar approximativement)
      if (newSignalement.lattitude < -26 || newSignalement.lattitude > -11 || 
          newSignalement.longitude < 43 || newSignalement.longitude > 51) {
        showToast(' Les coordonnées semblent incorrectes pour Madagascar', 'warning');
      }

      // Récupérer l'utilisateur connecté
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        showToast(' Session expirée, veuillez vous reconnecter', 'error');
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
      showToast(' Signalement créé avec succès !', 'success');
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

  const isTermine = (alert: Signalement) => {
    const s = (alert.status_code || alert.status || '').toLowerCase();
    return s === 'termine' || s.includes('termin');
  };

  const isEnCours = (alert: Signalement) => {
    const s = (alert.status_code || alert.status || '').toLowerCase();
    return s === 'en_cours' || s === 'en cours' || s.includes('cours');
  };

  const getProgressPercent = (alert: Signalement) => {
    if (isTermine(alert)) return 100;
    if (isEnCours(alert)) return 50;
    return 0;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateShort = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
              
              <p className="profile-name">{userName}</p>
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
            {filteredAlerts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((alert) => (
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
                            ref={editSurfaceRef}
                            type="number"
                            placeholder="Surface en m²"
                            value={editForm.surface || ''}
                            onChange={(e) => setEditForm({ ...editForm, surface: e.target.value ? Number(e.target.value) : undefined })}
                            onKeyDown={(e) => handleKeyNav(e, editBudgetRef)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Budget (Ar)</label>
                          <input
                            ref={editBudgetRef}
                            type="number"
                            placeholder="Budget en Ariary"
                            value={editForm.budget || ''}
                            onChange={(e) => setEditForm({ ...editForm, budget: e.target.value ? Number(e.target.value) : undefined })}
                            onKeyDown={(e) => handleKeyNav(e, editEntrepriseRef)}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Entreprise concernée</label>
                        <select
                          ref={editEntrepriseRef}
                          value={editForm.entreprise || ''}
                          onChange={(e) => setEditForm({ ...editForm, entreprise: e.target.value })}
                          onKeyDown={(e) => handleKeyNav(e, editLatRef)}
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
                            ref={editLatRef}
                            type="number"
                            step="0.0001"
                            placeholder="Ex: -18.9138"
                            value={editForm.lattitude || ''}
                            onChange={(e) => setEditForm({ ...editForm, lattitude: e.target.value ? Number(e.target.value) : undefined })}
                            onKeyDown={(e) => handleKeyNav(e, editLongRef)}
                          />
                        </div>
                        <div className="form-group">
                          <label>Longitude</label>
                          <input
                            ref={editLongRef}
                            type="number"
                            step="0.0001"
                            placeholder="Ex: 47.5361"
                            value={editForm.longitude || ''}
                            onChange={(e) => setEditForm({ ...editForm, longitude: e.target.value ? Number(e.target.value) : undefined })}
                            onKeyDown={(e) => handleKeyNav(e, editSubmitRef)}
                          />
                        </div>
                      </div>
                      <div className="form-actions">
                        <button className="btn-cancel" onClick={cancelEditing}>
                          Annuler
                        </button>
                        <button ref={editSubmitRef} className="btn-save" onClick={saveChanges}>
                          <i className="fas fa-save"></i> Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE — Layout like avancement.html
                  <div className={`card-avancement ${isTermine(alert) ? 'card-termine' : ''}`}>
                    <div className="avancement-layout">
                      {/* LEFT: Info Projet */}
                      <div className="avancement-info">
                        <div className="card-image">
                          <div className="image-placeholder">
                            <i className="fas fa-road"></i>
                          </div>
                        </div>
                        <div>
                          <h4 className="avancement-title">{alert.entreprise || 'Non assigné'}</h4>
                          <p className="avancement-location">
                            <i className="fas fa-map-marker-alt"></i> Coordonnées : {alert.lattitude}, {alert.longitude}
                          </p>
                          {/* Status badge inline */}
                          <div className={`avancement-badge ${
                            isTermine(alert) ? 'badge-green' : 
                            isEnCours(alert) ? 'badge-blue' : 'badge-red'
                          }`}>
                            {isTermine(alert) ? 'Terminé (100%)' : 
                             isEnCours(alert) ? 'En cours (50%)' : 'Nouveau (0%)'}
                          </div>
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

                      {/* RIGHT: Timeline Interactive */}
                      <div className="avancement-timeline">
                        {/* Lines */}
                        <div className="tl-line-bg"></div>
                        <div 
                          className={`tl-line-fill ${isTermine(alert) ? 'green' : 'blue'}`}
                          style={{ transform: `scaleX(${getProgressPercent(alert) / 100})` }}
                        ></div>

                        <div className="tl-steps">
                          {/* Step 1: Signalé */}
                          <div className="tl-step">
                            <div className={`tl-circle ${
                              isTermine(alert) ? 'done-green' : 
                              isEnCours(alert) ? 'done-blue' : 'done-blue'
                            }`}>
                              <i className="fas fa-exclamation"></i>
                            </div>
                            <div className="tl-label">
                              <p className="tl-name">Signalé</p>
                              <div className="tl-date-box">
                                <p>{formatDateShort(alert.date_signalement)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Step 2: En travaux */}
                          <div className="tl-step">
                            {isEnCours(alert) || isTermine(alert) ? (
                              <div className={`tl-circle ${
                                isTermine(alert) ? 'done-green' : 'done-blue'
                              }`}>
                                <i className={`fas ${isTermine(alert) ? 'fa-check' : 'fa-tools'}`}></i>
                              </div>
                            ) : (
                              <div 
                                className={`tl-circle clickable ${launchingAlert === alert.id ? 'active-selection' : ''}`}
                                onClick={() => activateLaunchMode(alert.id)}
                                title="Lancer les travaux"
                              >
                                <i className="fas fa-tools"></i>
                              </div>
                            )}
                            <div className="tl-label">
                              <p className="tl-name">En travaux</p>
                                {/* Date input quand on lance */}
                                {launchingAlert === alert.id && !isEnCours(alert) && !isTermine(alert) ? (
                                  <div className="tl-date-input">
                                    <input 
                                      type="date" 
                                      value={launchDate}
                                      onChange={(e) => setLaunchDate(e.target.value)}
                                    />
                                  </div>
                                ) : (
                                  <div className="tl-date-box">
                                    <p>{formatDateShort(alert.date_debut) || '-- / -- / ----'}</p>
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Step 3: Terminé */}
                          <div className="tl-step">
                            {isTermine(alert) ? (
                              <div className="tl-circle done-green">
                                <i className="fas fa-check"></i>
                              </div>
                            ) : (
                              <div 
                                className={`tl-circle clickable ${finishingAlert === alert.id ? 'active-selection' : ''}`}
                                onClick={() => activateFinishMode(alert.id)}
                                title="Terminer les travaux"
                              >
                                <i className="fas fa-flag-checkered"></i>
                              </div>
                            )}
                            <div className="tl-label">
                              <p className="tl-name">Terminé</p>
                              {/* Date input when finishing */}
                              {finishingAlert === alert.id && !isTermine(alert) ? (
                                <div className="tl-date-input">
                                  <input 
                                    type="date" 
                                    value={finishDate}
                                    onChange={(e) => setFinishDate(e.target.value)}
                                  />
                                </div>
                              ) : (
                                <div className={`tl-date-box ${isTermine(alert) ? 'tl-date-green' : ''}`}>
                                  <p>{formatDateShort(alert.date_fin) || '-- / -- / ----'}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* ZONE DE CONFIRMATION TERMINER */}
                        {finishingAlert === alert.id && !isTermine(alert) && (
                          <div className="confirm-zone">
                            <div className="confirm-zone-left">
                              <div className="confirm-icon">
                                <i className="fas fa-calendar-check"></i>
                              </div>
                              <div>
                                <p className="confirm-title">Valider la fin des travaux ?</p>
                                <p className="confirm-subtitle">Cette action est irréversible.</p>
                              </div>
                            </div>
                            <div className="confirm-actions">
                              <button className="confirm-btn-cancel" onClick={cancelFinishMode}>
                                ANNULER
                              </button>
                              <button className="confirm-btn" onClick={() => confirmFinish(alert.id)}>
                                CONFIRMER
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ZONE DE CONFIRMATION LANCER */}
                        {launchingAlert === alert.id && !isEnCours(alert) && !isTermine(alert) && (
                          <div className="confirm-zone confirm-zone-blue">
                            <div className="confirm-zone-left">
                              <div className="confirm-icon confirm-icon-blue">
                                <i className="fas fa-hammer"></i>
                              </div>
                              <div>
                                <p className="confirm-title">Lancer les travaux ?</p>
                                <p className="confirm-subtitle">Le signalement passera en cours.</p>
                              </div>
                            </div>
                            <div className="confirm-actions">
                              <button className="confirm-btn-cancel" onClick={cancelLaunchMode}>
                                ANNULER
                              </button>
                              <button className="confirm-btn confirm-btn-blue" onClick={() => confirmLaunch(alert.id)}>
                                CONFIRMER
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit button under the card — hidden for finished signalements */}
                    {!isTermine(alert) && (
                      <div className="avancement-actions">
                        <button className="btn-edit" onClick={() => startEditing(alert)}>
                          <i className="fas fa-edit"></i> Modifier les détails
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {filteredAlerts.length > ITEMS_PER_PAGE && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="pagination-info">
                Page {currentPage} / {Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)}
                <span className="pagination-total">({filteredAlerts.length} éléments)</span>
              </div>
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
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
                      ref={addSurfaceRef}
                      type="number"
                      placeholder="Surface en m²"
                      value={newSignalement.surface || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, surface: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => handleKeyNav(e, addBudgetRef)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Budget (Ar) *</label>
                    <input
                      ref={addBudgetRef}
                      type="number"
                      placeholder="Budget en Ariary"
                      value={newSignalement.budget || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, budget: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => handleKeyNav(e, addEntrepriseRef)}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Entreprise concernée</label>
                  <select
                    ref={addEntrepriseRef}
                    value={newSignalement.entreprise || ''}
                    onChange={(e) => setNewSignalement({ ...newSignalement, entreprise: e.target.value })}
                    onKeyDown={(e) => handleKeyNav(e, addLatRef)}
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
                      ref={addLatRef}
                      type="number"
                      step="0.0001"
                      placeholder="Ex: -18.9138"
                      value={newSignalement.lattitude || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, lattitude: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => handleKeyNav(e, addLongRef)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Longitude *</label>
                    <input
                      ref={addLongRef}
                      type="number"
                      step="0.0001"
                      placeholder="Ex: 47.5361"
                      value={newSignalement.longitude || ''}
                      onChange={(e) => setNewSignalement({ ...newSignalement, longitude: e.target.value ? Number(e.target.value) : undefined })}
                      onKeyDown={(e) => handleKeyNav(e, addSubmitRef)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
                <button ref={addSubmitRef} className="btn-save" onClick={createSignalement}>
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
              <i className="fas fa-map-marked-alt"></i>
            </button>
            <button className="footer-btn" onClick={() => history.push('/dashboard')}>
              <i className="fas fa-chart-line"></i>
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
            <button className="footer-btn" onClick={() => history.push('/users-list')}>
              <i className="fas fa-users-cog"></i>
            </button>
            <button className="footer-btn" onClick={() => history.push('/performance')}>
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

export default Management;
