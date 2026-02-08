import { useEffect, useState } from 'react';
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

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);
  const [userName, setUserName] = useState('Manager');
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    loadUsers();
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
      showToast(` ${result.addedToFirebase} utilisateurs ajoutés, ${result.updatedInFirebase} mis à jour`, 'success');
      await loadUsers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors de la synchronisation', 'error');
    } finally {
      setSyncing(false);
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
          <div className="nav-links" style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => history.push('/home')} 
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
            >
              Dashboard
            </button>
            <button 
              onClick={() => history.push('/management')} 
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
            >
              Signalements
            </button>
            <button 
              onClick={() => history.push('/performance')} 
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <i className="fas fa-chart-line"></i>
              Performance
            </button>
          </div>
          <div className="navbar-right">
            <div className="profile-info">
              <p className="profile-name">{userName}</p>
            </div>
            <div style={{ position: 'relative' }}>
              <div 
                className="profile-avatar" 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ cursor: 'pointer' }}
              >
                <i className="fas fa-user-tie"></i>
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
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-map-marked-alt"></i> Carte
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/dashboard'); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-chart-pie"></i> Dashboard
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/management'); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-cog"></i> Gestion
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/performance'); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-chart-line"></i> Performance
                  </button>
                  <button 
                    onClick={() => { setShowUserMenu(false); history.push('/blocked-users'); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#0f172a',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <i className="fas fa-user-shield"></i> Utilisateurs bloqués
                  </button>
                  <button 
                    onClick={() => { localStorage.removeItem('user'); setShowUserMenu(false); history.push('/login'); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#dc2626',
                      borderRadius: '8px',
                      marginTop: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
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
        <main className="users-content">
          {/* HEADER */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Gestion des Utilisateurs</h1>
              <p className="page-subtitle">Vue d'ensemble de tous les comptes utilisateurs</p>
            </div>
            <button 
              className="btn-sync" 
              onClick={handleSyncUsers}
              disabled={syncing}
            >
              <i className={`fas fa-sync-alt ${syncing ? 'fa-spin' : ''}`}></i>
              {syncing ? 'Synchronisation...' : 'Sync Firebase'}
            </button>
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
                  filteredUsers.map((user) => (
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
        </main>

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
