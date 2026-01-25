import { useEffect, useRef } from 'react';
import { IonContent, IonPage } from '@ionic/react';
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

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Hook up to /api/login when backend wiring is ready.
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

            <div id="error-message" className="error-container" aria-live="polite">
              <p className="error-text">Trop de tentatives. Utilisateur bloqué. Contactez le manager.</p>
            </div>

            <form onSubmit={handleSubmit}>
              <input type="email" name="email" placeholder="Email ou téléphone" required />
              <input type="password" name="password" placeholder="Mot de passe" required />
              <button type="submit" className="btn-primary">Continuer</button>
            </form>

            <div className="actions">
              <a href="#">Oublié ?</a>
              <span className="separator" />
              <a href="#">Créer un compte</a>
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
