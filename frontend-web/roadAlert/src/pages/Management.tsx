import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { fetchRoadAlerts, RoadAlert, updateRoadAlert, updateAlertStatus } from '../utils/roadAlertApi';
import './Management.css';

type FilterType = 'all' | 'new' | 'progress';

const Management: React.FC = () => {
  const [alerts, setAlerts] = useState<RoadAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<RoadAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [editingAlert, setEditingAlert] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<RoadAlert>>({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filter]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchRoadAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;
    if (filter === 'new') {
      filtered = alerts.filter(a => a.status.toLowerCase() === 'nouveau');
    } else if (filter === 'progress') {
      filtered = alerts.filter(a => a.status.toLowerCase() === 'en cours');
    }
    setFilteredAlerts(filtered);
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      await updateAlertStatus(alertId, newStatus);
      setToastMessage('Statut mis à jour avec succès');
      setShowToast(true);
      await loadAlerts();
    } catch (error) {
      setToastMessage('Erreur lors de la mise à jour');
      setShowToast(true);
    }
  };

  const startEditing = (alert: RoadAlert) => {
    setEditingAlert(alert.id || '');
    setEditForm(alert);
  };

  const cancelEditing = () => {
    setEditingAlert(null);
    setEditForm({});
  };

  const saveChanges = async () => {
    if (!editingAlert || !editForm.id) return;
    
    try {
      await updateRoadAlert(editForm as RoadAlert);
      setToastMessage('Signalement mis à jour avec succès');
      setShowToast(true);
      setEditingAlert(null);
      setEditForm({});
      await loadAlerts();
    } catch (error) {
      setToastMessage('Erreur lors de la mise à jour');
      setShowToast(true);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'nouveau':
        return 'status-new';
      case 'en cours':
        return 'status-progress';
      case 'terminé':
        return 'status-done';
      default:
        return 'status-new';
    }
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
              Road<span className="brand-accent">Watch</span>
            </div>
            <span className="manager-badge">Console Manager</span>
          </div>
          <div className="navbar-right">
            <div className="profile-info">
              <p className="profile-label">Connecté en tant que</p>
              <p className="profile-name">Manager</p>
            </div>
            <div className="profile-avatar">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Manager" alt="profile" />
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="management-content">
          {/* HEADER */}
          <div className="management-header">
            <h1 className="page-title">Gestion des interventions</h1>
            <p className="page-subtitle">
              Modifiez le statut des signalements et assignez les entreprises de travaux.
            </p>
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
                            value={editForm.surface || 0}
                            onChange={(e) => setEditForm({ ...editForm, surface: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Budget (Ar)</label>
                          <input
                            type="number"
                            value={editForm.budget || 0}
                            onChange={(e) => setEditForm({ ...editForm, budget: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Entreprise concernée</label>
                        <input
                          type="text"
                          value={editForm.concerned_entreprise || ''}
                          onChange={(e) => setEditForm({ ...editForm, concerned_entreprise: e.target.value })}
                        />
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Latitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.latitude || 0}
                            onChange={(e) => setEditForm({ ...editForm, latitude: Number(e.target.value) })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Longitude</label>
                          <input
                            type="number"
                            step="0.0001"
                            value={editForm.longitude || 0}
                            onChange={(e) => setEditForm({ ...editForm, longitude: Number(e.target.value) })}
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
                        <span className={`status-pill ${getStatusClass(alert.status)}`}>
                          {alert.status}
                        </span>
                        <h3 className="alert-title">{alert.concerned_entreprise}</h3>
                        <p className="alert-location">
                          <i className="fas fa-map-marker-alt"></i> Coordonnées : {alert.latitude}, {alert.longitude}
                        </p>
                        <div className="alert-meta">
                          <div className="meta-item">
                            Signalé le : <span>{formatDate(alert.date_alert)}</span>
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
                            onClick={() => handleStatusChange(alert.id!, 'En cours')}
                          >
                            <i className="fas fa-hammer"></i>
                            <span>Lancer</span>
                          </button>
                          <button
                            className="status-btn done"
                            onClick={() => handleStatusChange(alert.id!, 'Terminé')}
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

        {/* FOOTER */}
        <footer className="management-footer">
          <div className="footer-nav">
            <button className="footer-btn">
              <i className="fas fa-home"></i>
            </button>
            <button className="footer-btn">
              <i className="fas fa-map-marked-alt"></i>
            </button>
            <button className="footer-btn disabled">
              <i className="fas fa-plus-circle"></i>
            </button>
            <button className="footer-btn active">
              <i className="fas fa-tasks"></i>
            </button>
            <button className="footer-btn">
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </footer>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="top"
          color={toastMessage.includes('succès') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default Management;
