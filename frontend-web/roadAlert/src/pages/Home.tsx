import { useEffect, useState, useRef } from 'react';
import { IonContent, IonPage, IonToast, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api, Signalement, Stats, User } from '../utils/api';
import L from 'leaflet';
import '../assets/leaflet/leaflet.css';
import './Home.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  show: boolean;
  message: string;
  type: ToastType;
}

const Home: React.FC = () => {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Signalement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [toast, setToast] = useState<Toast>({ show: false, message: '', type: 'success' });
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const mapInitialized = useRef(false);
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

  // Fonction pour vérifier si le token JWT est encore valide
  const isTokenValid = (token: string): boolean => {
    if (!token) return false;
    try {
      // Décoder le payload du JWT (partie centrale)
      const payload = JSON.parse(atob(token.split('.')[1]));
      // Vérifier si le token n'est pas expiré
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    // Par défaut, l'utilisateur est en mode visiteur (user = null)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // Vérifier que le token existe et est valide
        if (userData.token && isTokenValid(userData.token)) {
          setUser(userData);
        } else {
          // Token absent ou expiré -> supprimer et rester en mode visiteur
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (e) {
        // Données corrompues -> nettoyer
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    
    // CORRECTION : Initialiser la carte après un court délai pour attendre le rendu complet du DOM
    if (!mapInitialized.current) {
      // Utiliser requestAnimationFrame puis setTimeout pour s'assurer que tout est rendu
      requestAnimationFrame(() => {
        setTimeout(() => {
          initMap();
          mapInitialized.current = true;
        }, 50);
      });
    }
    
    loadData();
    
    // Cleanup lors du démontage du composant
    return () => {
      if (mapRef.current) {
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];
        mapRef.current.remove();
        mapRef.current = null;
        mapInitialized.current = false;
      }
    };
  }, []);

  // Mettre à jour les markers quand les signalements changent
  useEffect(() => {
    if (mapRef.current && signalements.length > 0) {
      updateMarkers();
    }
  }, [signalements]);

  // Recharger les données chaque fois qu'on revient sur cette page
  useIonViewWillEnter(() => {
    loadData();
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [signalementsData, statsData] = await Promise.all([
        api.getSignalements(),
        api.getStats()
      ]);
      setSignalements(signalementsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement:', err);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initMap = () => {
    if (mapRef.current) return;
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    mapRef.current = L.map('map', { zoomControl: false }).setView([-18.8792, 47.5079], 13);
    
    // Ajout d'un timestamp pour forcer le rechargement des tuiles sans cache
    const cacheBuster = new Date().getTime();
    L.tileLayer('http://localhost:8080/tile/{z}/{x}/{y}.png?v=' + cacheBuster, {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current);

    mapRef.current.on('click', () => setSelected(null));

    // CORRECTION : Forcer le recalcul des dimensions après initialisation
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  const updateMarkers = () => {
    // Supprimer les anciens markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!mapRef.current) return;

    // Ajouter les nouveaux markers
    signalements.forEach(s => {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="custom-pin"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const lat = Number(s.lattitude) || 0;
      const lng = Number(s.longitude) || 0;

      const marker = L.marker([lat, lng], { icon: customIcon })
        .addTo(mapRef.current!);

      marker.on('mouseover', () => setSelected(s));
      marker.on('click', () => {
        mapRef.current?.flyTo([lat, lng], 15);
        setSelected(s);
      });

      markersRef.current.push(marker);
    });
  };

  const handleSync = async () => {
    if (syncing) return;
    
    try {
      setSyncing(true);
      const result = await api.syncFromFirebase();
      
      // Construire un message détaillé
      let message = ' Synchronisation terminée ! ';
      if (result.addedToPostgres || result.updatedInPostgres) {
        message += `${result.addedToPostgres || 0} ajouté(s), ${result.updatedInPostgres || 0} mis à jour.`;
      } else if (result.synced || result.updated) {
        message += `${result.synced || 0} nouveau(x), ${result.updated || 0} mis à jour.`;
      } else {
        message = ' Tout est déjà synchronisé !';
      }
      
      showToast(message, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erreur de synchronisation', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowUserMenu(false);
    showToast('Déconnexion réussie', 'info');
    setTimeout(() => history.push('/login'), 1000);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // L'utilisateur est manager SEULEMENT s'il est connecté (user non null) ET a le type 'manager'
  const isAuthenticated = user !== null && user.token !== undefined;
  const isManager = isAuthenticated && user?.type_user?.toLowerCase() === 'manager';

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatBudget = (budget: number) => {
    if (budget >= 1000000000) return `${(budget / 1000000000).toFixed(2)} Md Ar`;
    if (budget >= 1000000) return `${(budget / 1000000).toFixed(0)} M Ar`;
    return `${budget.toLocaleString()} Ar`;
  };

  const getStatusInfo = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s === 'termine' || s.includes('termin')) return { class: 'badge-done', label: status || 'Termine' };
    if (s.includes('cours')) return { class: 'badge-progress', label: status || 'En cours' };
    return { class: 'badge-new', label: status || 'Nouveau' };
  };

  return (
    <IonPage className="home-page">
      <IonContent fullscreen scrollY={false}>
        {/* CARTE EN FOND */}
        <div id="map"></div>

        {/* NAVBAR */}
        <nav className="navbar glass-nav">
          <div className="navbar-brand">
            Road<span className="brand-accent">Alert</span>
            <span className="brand-tag">Tana</span>
          </div>

          <div className="navbar-right">
            {isManager && (
              <button className="btn-sync" onClick={handleSync} disabled={syncing}>
                <i className={`fas fa-sync-alt ${syncing ? 'fa-spin' : ''}`}></i>
                <span>{syncing ? 'Sync...' : 'Synchroniser'}</span>
              </button>
            )}
            {!user && (
              <button 
                className="btn-sync" 
                onClick={() => history.push('/login')}
                style={{ background: '#3b82f6', color: 'white' }}
              >
                <i className="fas fa-sign-in-alt"></i>
                <span>Se connecter</span>
              </button>
            )}
            <i className="far fa-compass nav-icon"></i>
            <div className="user-section">
              {user ? (
                <>
                  <div className="user-info-text">
                    <span className="user-role">{user.type_user}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <div className="avatar" onClick={toggleUserMenu} title="Menu utilisateur" style={{ cursor: 'pointer', background: user.type_user?.toLowerCase() === 'manager' ? '#3b82f6' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <i className="fas fa-user-tie" style={{ color: 'white', fontSize: '20px' }}></i>
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
                        boxShadow: '0 10px 40px -12px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        padding: '8px',
                        minWidth: '200px',
                        zIndex: 1000
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Connecté en tant que</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0f172a' }}>{user.username}</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>{user.email}</p>
                      </div>
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
                        <i className="fas fa-chart-line"></i> Tableau de bord
                      </button>
                      {isManager && (
                        <>
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
                        </>
                      )}
                      <button 
                        onClick={handleLogout}
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
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <div className="user-info-text">
                    <span className="user-role">Visiteur</span>
                  </div>
                  <div className="avatar" onClick={toggleUserMenu} title="Menu" style={{ cursor: 'pointer', background: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="fas fa-user" style={{ color: 'white', fontSize: '20px' }}></i>
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
                        boxShadow: '0 10px 40px -12px rgba(0,0,0,0.25)',
                        border: '1px solid rgba(226, 232, 240, 0.8)',
                        padding: '8px',
                        minWidth: '200px',
                        zIndex: 1000
                      }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Mode</p>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#0f172a' }}>Visiteur</p>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '2px 0 0 0' }}>Accès limité</p>
                      </div>
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
                        <i className="fas fa-chart-line"></i> Tableau de bord
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* CONTENU PRINCIPAL */}
        <main className="main-content">
          {/* PANNEAU GAUCHE - Stats */}
          <div className="panel-left">
            <div className="floating-card stats-card">
              <h2 className="card-title">État global</h2>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px' }}>
                  <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '32px', color: '#3b82f6' }}></i>
                    <span>Chargement...</span>
                  </div>
                </div>
              ) : (
                <div className="stats-content">
                  <div className="stat-item">
                    <p className="stat-number">{stats?.total_points || 0}</p>
                    <p className="stat-label">Points recensés à Tana</p>
                  </div>
                  <div className="progress-section">
                    <div className="progress-header">
                      <span className="progress-label">Réparation Globale</span>
                      <span className="progress-value">{stats?.avancement || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${stats?.avancement || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ESPACE CENTRAL - Carte en dessous */}
          <div className="panel-center"></div>

          {/* PANNEAU DROITE - Détail */}
          <div className="panel-right">
            {selected ? (
              <div className="floating-card detail-card visible">
                <div className="detail-image">
                  <img src="https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600" alt="travaux" />
                  <span className={`badge ${getStatusInfo(selected.status).class}`}>
                    {getStatusInfo(selected.status).label}
                  </span>
                </div>
                <div className="detail-content">
                  <h3 className="detail-title">{selected.entreprise || 'Signalement'}</h3>
                  <p className="detail-date">Signalé le {formatDate(selected.date_signalement)}</p>
                  
                  <div className="detail-rows">
                    <div className="detail-row">
                      <span className="row-label">Surface</span>
                      <span className="row-value">{selected.surface} m²</span>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Budget</span>
                      <span className="row-value budget">{formatBudget(selected.budget)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="row-label">Entreprise</span>
                      <span className="row-value company">{selected.entreprise || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="floating-card help-card">
                <i className="fas fa-mouse-pointer"></i>
                <p>Survolez un point bleu sur la carte</p>
              </div>
            )}
          </div>
        </main>

        {/* FOOTER NAV */}
        <div className="footer-nav glass-nav">
          <button className="footer-btn active">
            <i className="fas fa-home"></i>
          </button>
          <button className="footer-btn" onClick={() => history.push('/dashboard')}>
            <i className="fas fa-chart-bar"></i>
          </button>
          <button className="footer-btn disabled">
            <i className="fas fa-plus-circle"></i>
          </button>
          <button 
            className="footer-btn" 
            onClick={() => {
              if (!isManager) {
                showToast(' Accès réservé aux managers. Connectez-vous.', 'warning');
              } else {
                history.push('/management');
              }
            }}
          >
            <i className="fas fa-cog"></i>
          </button>
          <button 
            className="footer-btn" 
            onClick={() => {
              if (!isManager) {
                showToast(' Accès réservé aux managers. Connectez-vous.', 'warning');
              } else {
                history.push('/performance');
              }
            }}
          >
            <i className="fas fa-tachometer-alt"></i>
          </button>
        </div>

        {/* TOAST NOTIFICATIONS */}
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

export default Home;
