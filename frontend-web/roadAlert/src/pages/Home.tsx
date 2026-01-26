import { useEffect, useState, useRef } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api, Signalement, Stats, User } from '../utils/api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './Home.css';

const Home: React.FC = () => {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Signalement | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const history = useHistory();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    loadData();
  }, []);

  useEffect(() => {
    initMap();
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [signalements]);

  const loadData = async () => {
    try {
      const [signalementsData, statsData] = await Promise.all([
        api.getSignalements(),
        api.getStats()
      ]);
      setSignalements(signalementsData);
      setStats(statsData);
    } catch (err) {
      console.error('Erreur chargement:', err);
    }
  };

  const initMap = () => {
    if (mapRef.current) return;
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    mapRef.current = L.map('map', { zoomControl: false }).setView([-18.8792, 47.5079], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(mapRef.current);

    signalements.forEach(s => {
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: '<div class="custom-pin"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const marker = L.marker([s.lattitude, s.longitude], { icon: customIcon })
        .addTo(mapRef.current!);

      marker.on('mouseover', () => setSelected(s));
      marker.on('click', () => {
        mapRef.current?.flyTo([s.lattitude, s.longitude], 15);
        setSelected(s);
      });

      markersRef.current.push(marker);
    });

    mapRef.current.on('click', () => setSelected(null));
  };

  const handleSync = async () => {
    try {
      const count = await api.syncFromFirebase();
      alert(`${count} signalements synchronisés`);
      loadData();
    } catch (err) {
      alert('Erreur de synchronisation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const isManager = user?.type_user?.toLowerCase() === 'manager';

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
    if (s.includes('termin')) return { class: 'badge-done', label: 'Terminé' };
    if (s.includes('cours')) return { class: 'badge-progress', label: 'En cours' };
    return { class: 'badge-new', label: 'Nouveau' };
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

          <div className="navbar-search">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Rechercher une zone..." />
          </div>

          <div className="navbar-right">
            {isManager && (
              <button className="btn-sync" onClick={handleSync}>
                <i className="fas fa-sync-alt"></i>
                <span>Synchroniser</span>
              </button>
            )}
            <i className="far fa-compass nav-icon"></i>
            <div className="user-section">
              {user ? (
                <>
                  <div className="user-info-text">
                    <span className="user-role">{user.type_user}</span>
                  </div>
                  <div className="avatar" onClick={handleLogout} title="Déconnexion">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="profile" />
                  </div>
                </>
              ) : (
                <>
                  <div className="user-info-text">
                    <span className="user-role">Visiteur</span>
                  </div>
                  <div className="avatar" onClick={() => history.push('/login')} title="Se connecter">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Guest" alt="profile" />
                  </div>
                </>
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
          <button className="footer-btn" onClick={() => history.push('/management')}>
            <i className="fas fa-cog"></i>
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
