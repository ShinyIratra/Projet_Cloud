import { useEffect, useState } from 'react';
import { IonContent, IonPage, IonToast } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api } from '../utils/api';
import './BlockedUsers.css';

interface BlockedUser {
  id_users: number;
  username: string;
  email: string;
}

const BlockedUsers: React.FC = () => {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const history = useHistory();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      history.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.type_user?.toLowerCase() !== 'manager') {
      alert('⚠️ Accès refusé : Cette page est réservée aux managers');
      history.push('/home');
      return;
    }
    loadBlockedUsers();
  }, [history]);

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getBlockedUsers();
      setBlockedUsers(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: number) => {
    try {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;
      const manager = JSON.parse(storedUser);
      
      await api.unblockUser(userId, manager.id);
      setToastMessage('Utilisateur débloqué avec succès');
      setShowToast(true);
      await loadBlockedUsers();
    } catch (error) {
      setToastMessage('Erreur lors du déblocage');
      setShowToast(true);
    }
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
              Road<span className="brand-accent">Watch</span>
            </div>
            <span className="admin-badge">Admin</span>
          </div>
          <div className="navbar-right">
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
              <input type="text" placeholder="Rechercher un utilisateur..." />
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="quick-stats">
            <div className="stat-box">
              <p className="stat-box-label">Utilisateurs Bloqués</p>
              <p className="stat-box-value blocked">{blockedUsers.length}</p>
            </div>
            <div className="stat-box">
              <p className="stat-box-label">Total Comptes</p>
              <p className="stat-box-value">{blockedUsers.length + 10}</p>
            </div>
          </div>

          {/* BLOCKED USERS LIST */}
          <div className="users-list">
            <h3 className="list-title">Liste des comptes bloqués</h3>
            
            {blockedUsers.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-check-circle"></i>
                <p>Aucun utilisateur bloqué</p>
                <p className="empty-subtitle">Tous les comptes sont actifs</p>
              </div>
            ) : (
              blockedUsers.map((user) => (
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
                      <span className="uid-pill">UID: {user.id_users}</span>
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    <span className="status-blocked">Bloqué</span>
                    <button 
                      className="btn-unlock" 
                      onClick={() => handleUnblock(user.id_users)}
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
            <i className="fas fa-home"></i>
          </button>
          <button className="footer-btn" onClick={() => history.push('/dashboard')}>
            <i className="fas fa-chart-line"></i>
          </button>
          <button className="footer-btn" onClick={() => history.push('/management')}>
            <i className="fas fa-tasks"></i>
          </button>
          <button className="footer-btn active">
            <i className="fas fa-user-shield"></i>
          </button>
          <button className="footer-btn">
            <i className="fas fa-cog"></i>
          </button>
        </footer>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
          color={toastMessage.includes('succès') ? 'success' : 'danger'}
        />
      </IonContent>
    </IonPage>
  );
};

export default BlockedUsers;
