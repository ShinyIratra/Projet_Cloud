import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api } from '../utils/api';
import './BlockedUsers.css';

interface BlockedUser {
  id_users: number;
  username: string;
  email: string;
  blocked_at?: string;
  reason?: string;
}

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  show: boolean;
  message: string;
  type: ToastType;
}

const BlockedUsers: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName] = useState('Manager');
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
    loadBlockedUsers();
  }, [history]);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getBlockedUsers();
      setBlockedUsers(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      showToast(error.message || 'Erreur lors du chargement des utilisateurs bloqués', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: number, username: string) => {
    try {
      await api.unblockUser(userId);
      showToast(` L'utilisateur ${username} a été débloqué avec succès !`, 'success');
      await loadBlockedUsers();
    } catch (error: any) {
      showToast(error.message || 'Erreur lors du déblocage', 'error');
    }
  };

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = blockedUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <IonPage className="blocked-users-page">
        <IonContent fullscreen>
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="blocked-users-page">
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
            <div className="profile-avatar" style={{ background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-user-tie" style={{ color: 'white', fontSize: '20px' }}></i>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="blocked-users-content">
          {/* HEADER */}
          <div className="page-header">
            <div>
              <h1 className="page-title">Sécurité & Utilisateurs</h1>
              <p className="page-subtitle">Gérez les accès et débloquez les comptes suspendus.</p>
            </div>
            <div className="search-bar">
              <i className="fas fa-search"></i>
              <input 
                type="text" 
                placeholder="Rechercher un utilisateur..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="quick-stats">
            <div className="stat-box">
              <p className="stat-box-label">Utilisateurs Bloqués</p>
              <p className="stat-box-value blocked">{blockedUsers.length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Affichés</p>
              <p className="stat-box-value">{filteredUsers.length}</p>
            </div>
          </div>

          {/* BLOCKED USERS LIST */}
          <div className="users-list">
            <h3 className="list-title">Liste des comptes bloqués</h3>
            
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun utilisateur bloqué'}</p>
                <p className="empty-subtitle">{searchQuery ? 'Essayez une autre recherche' : 'Tous les comptes sont actifs'}</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id_users} className="user-card">
                  <div className="user-info">
                    <div className="user-avatar">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                        alt={user.username} 
                      />
                    </div>
                    <div className="user-details">
                      <h4 className="user-name">{user.username}</h4>
                      <p className="user-email">{user.email}</p>
                      <span className="uid-pill">ID: {user.id_users}</span>
                      {user.blocked_at && (
                        <p className="blocked-date">Bloqué le {formatDate(user.blocked_at)}</p>
                      )}
                      {user.reason && (
                        <p className="blocked-reason">Raison: {user.reason}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    <span className="status-blocked">Bloqué</span>
                    <button 
                      className="btn-unlock" 
                      onClick={() => handleUnblock(user.id_users, user.username)}
                    >
                      <i className="fas fa-unlock"></i> Débloquer
                    </button>
                  </div>
                </div>
              ))
            )}
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
            <button className="footer-btn active">
              <i className="fas fa-user-shield"></i>
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

export default BlockedUsers;
