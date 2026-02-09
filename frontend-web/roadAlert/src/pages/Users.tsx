import { useEffect, useState, useRef } from 'react';
import { IonContent, IonPage, IonToast, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api } from '../utils/api';
import './Users.css';

interface User {
  id_users: number;
  username: string;
  email: string;
  type_user: string;
  status_code: string;
  last_update: string;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  show: boolean;
  message: string;
  type: ToastType;
}

const ITEMS_PER_PAGE = 10;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [userName, setUserName] = useState('Manager');
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: ''
  });
  const history = useHistory();

  // Refs for keyboard navigation
  const usernameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (showAddModal) {
      setTimeout(() => usernameRef.current?.focus(), 100);
    }
  }, [showAddModal]);

  // Handle keyboard navigation
  const handleKeyNav = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | HTMLButtonElement | null> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
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
      showToast('Accès refusé : Connectez-vous en tant que manager', 'error');
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
      loadUsers();
    } catch (e) {
      localStorage.removeItem('user');
      showToast('Erreur d\'authentification', 'error');
      setTimeout(() => history.push('/home'), 1500);
      setAuthChecked(true);
    }
  }, [history]);

  // Recharger les données chaque fois qu'on revient sur cette page
  useIonViewWillEnter(() => {
    loadUsers();
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers();
      setUsers(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      showToast(error.message || 'Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      const result = await api.syncUsersToFirebase();
      const parts = [];
      if (result.addedToFirebase > 0) parts.push(`${result.addedToFirebase} ajoutés à Firebase`);
      if (result.updatedInFirebase > 0) parts.push(`${result.updatedInFirebase} mis à jour sur Firebase`);
      if (result.addedToPostgres > 0) parts.push(`${result.addedToPostgres} ajoutés depuis Firebase`);
      if (result.updatedInPostgres > 0) parts.push(`${result.updatedInPostgres} mis à jour depuis Firebase`);
      const msg = parts.length > 0 ? parts.join(', ') : 'Tout est déjà synchronisé';
      showToast(msg, 'success');
      await loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la synchronisation', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validation
      if (!newUser.username || !newUser.email || !newUser.password) {
        showToast('Tous les champs sont requis', 'warning');
        return;
      }

      if (newUser.username.length < 3) {
        showToast('Le nom d\'utilisateur doit contenir au moins 3 caractères', 'warning');
        return;
      }

      if (newUser.password.length < 6) {
        showToast('Le mot de passe doit contenir au moins 6 caractères', 'warning');
        return;
      }

      await api.createUser(newUser);
      showToast(`Utilisateur ${newUser.username} créé avec succès !`, 'success');
      setShowAddModal(false);
      setNewUser({ username: '', email: '', password: '' });
      await loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la création de l\'utilisateur', 'error');
    }
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || user.type_user.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || user.status_code === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterStatus]);

  // Paginated users
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Extraire les types et statuts uniques dynamiquement
  const uniqueTypes = Array.from(new Set(users.map(u => u.type_user.toLowerCase()))).filter(Boolean);
  const uniqueStatuses = Array.from(new Set(users.map(u => u.status_code))).filter(Boolean);

  const stats = {
    total: users.length,
    managers: users.filter(u => u.type_user.toLowerCase() === 'manager').length,
    utilisateurs: users.filter(u => u.type_user.toLowerCase() === 'utilisateur').length,
    active: users.filter(u => u.status_code === 'active').length,
    blocked: users.filter(u => u.status_code === 'blocked').length
  };

  // Afficher un loader ou rien tant que l'auth n'est pas vérifiée ou si pas manager
  if (!authChecked || !isManager) {
    return (
      <IonPage className="users-page">
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
      <IonPage className="users-page">
        <IonContent fullscreen>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="users-page">
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
        <main className="users-content">
          {/* HEADER */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Gestion des Utilisateurs</h1>
              <p className="page-subtitle">Vue d'ensemble de tous les comptes utilisateurs</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <i className="fas fa-user-plus"></i> Ajouter utilisateur
              </button>
              <button 
                className="btn-sync" 
                onClick={handleSyncUsers}
                disabled={syncing}
              >
                <i className={`fas fa-sync-alt ${syncing ? 'fa-spin' : ''}`}></i>
                {syncing ? 'Synchronisation...' : 'Sync Firebase'}
              </button>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="filters-section">
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Rechercher un utilisateur..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label>Type:</label>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Tous</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Statut:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Tous</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* STATS */}
          <div className="quick-stats">
            <div className="stat-box">
              <p className="stat-box-label">Total</p>
              <p className="stat-box-value">{stats.total}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Managers</p>
              <p className="stat-box-value managers">{stats.managers}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Utilisateurs</p>
              <p className="stat-box-value users">{stats.utilisateurs}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Actifs</p>
              <p className="stat-box-value active">{stats.active}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Bloqués</p>
              <p className="stat-box-value blocked">{stats.blocked}</p>
            </div>
          </div>

          {/* USERS TABLE */}
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Dernière mise à jour</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      <i className="fas fa-users" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }}></i>
                      <p>Aucun utilisateur trouvé</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id_users}>
                      <td>{user.id_users}</td>
                      <td>
                        <div className="user-cell">
                          {/* <div className="user-avatar-small">
                            <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                              alt={user.username} 
                            />
                          </div> */}
                          <strong>{user.username}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge badge-${user.type_user.toLowerCase()}`}>
                          {user.type_user.charAt(0).toUpperCase() + user.type_user.slice(1)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-status-${user.status_code || 'active'}`}>
                          {user.status_code.charAt(0).toUpperCase() + user.status_code.slice(1)}
                        </span>
                      </td>
                      <td>{formatDate(user.last_update)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {filteredUsers.length > ITEMS_PER_PAGE && (
            <div className="pagination">
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <div className="pagination-info">
                Page {currentPage} / {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
                <span className="pagination-total">({filteredUsers.length} éléments)</span>
              </div>
              <button 
                className="pagination-btn" 
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), p + 1))}
                disabled={currentPage === Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </main>

        {/* MODAL D'AJOUT D'UTILISATEUR */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '24px', padding: '32px', maxWidth: '500px', width: '90%' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>Nouvel utilisateur</h3>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer' }}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Nom d'utilisateur *
                  </label>
                  <input
                    ref={usernameRef}
                    type="text"
                    placeholder="Ex: johndoe"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    onKeyDown={(e) => handleKeyNav(e, emailRef)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Email *
                  </label>
                  <input
                    ref={emailRef}
                    type="email"
                    placeholder="Ex: john@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    onKeyDown={(e) => handleKeyNav(e, passwordRef)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>
                    Mot de passe *
                  </label>
                  <input
                    ref={passwordRef}
                    type="password"
                    placeholder="Minimum 6 caractères"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    onKeyDown={(e) => handleKeyNav(e, submitRef)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '16px 0 0 0', fontStyle: 'italic' }}>
                  Tous les comptes créés seront de type "Utilisateur"
                </p>
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button 
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: 'white',
                    color: '#64748b'
                  }}
                >
                  Annuler
                </button>
                <button 
                  ref={submitRef}
                  onClick={handleCreateUser}
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="fas fa-save"></i> Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER NAV */}
        <footer className="footer-nav">
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
          <button className="footer-btn active">
            <i className="fas fa-users-cog"></i>
          </button>
          <button className="footer-btn" onClick={() => history.push('/performance')}>
            <i className="fas fa-tachometer-alt"></i>
          </button>
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

export default Users;
