import { useEffect, useRef, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { api } from '../utils/api';
import './Login.css';

type Particle = {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
};

const Login: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particlesRef.current = [];
      const count = (canvas.width * canvas.height) / 12000;
      for (let i = 0; i < count; i += 1) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
        });
      }
    };

    const updateParticles = (color: string, opacity: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particlesRef.current.length; i += 1) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = `rgba(${color}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i; j < particlesRef.current.length; j += 1) {
          const other = particlesRef.current[j];
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            const lineOpacity = (1 - dist / 150) * opacity;
            ctx.strokeStyle = `rgba(${color}, ${lineOpacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      const style = getComputedStyle(document.documentElement);
      const color = style.getPropertyValue('--dot-color').trim();
      const baseOpacity = parseFloat(style.getPropertyValue('--dot-opacity'));
      updateParticles(color, baseOpacity);
      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener('resize', resize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await api.login(email, password);
      // Stocker l'utilisateur dans localStorage
      localStorage.setItem('user', JSON.stringify(user));
      // Rediriger vers la page d'accueil
      history.push('/home');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    history.push('/register');
  };

  const handleVisitor = () => {
    localStorage.removeItem('user');
    history.push('/home');
  };

  return (
    <IonPage className="login-page">
      <IonContent fullscreen className="login-content">
        <canvas ref={canvasRef} className="login-canvas" />
        <div className="login-wrapper">
          <main className="card">
            <div className="logo" aria-hidden>●</div>
            <h1>Identifiant</h1>
            <p className="subtitle">Entrer vos identifiants</p>

            <div id="error-message" className={`error-container ${error ? 'show' : ''}`} aria-live="polite">
              <p className="error-text">{error}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input 
                type="password" 
                name="password" 
                placeholder="Mot de passe" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Connexion...' : 'Continuer'}
              </button>
            </form>

            <div className="actions">
              <a href="#" onClick={handleVisitor}>Mode visiteur</a>
              <span className="separator" />
              <a href="#" onClick={handleRegister}>Créer un compte</a>
            </div>
          </main>

          <footer className="footer">
            <p>Données et confidentialité</p>
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;
