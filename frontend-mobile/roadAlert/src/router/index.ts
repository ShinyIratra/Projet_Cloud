import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import Profile from '../views/Profile.vue'
import Settings from '../views/Settings.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// Navigation guard pour protéger les routes
router.beforeEach((to, from, next) => {
  const authToken = localStorage.getItem('authToken');
  const isAuthenticated = !!authToken;
  const authRoutes = ['/login', '/register'];
  const publicRoutes = ['/login', '/register', '/home', '/dashboard', '/profile', '/settings'];

  // Si déjà connecté et essaie d'aller sur login/register, rediriger vers home
  if (authRoutes.includes(to.path) && isAuthenticated) {
    next('/home');
  } else if (!publicRoutes.includes(to.path) && !isAuthenticated) {
    // Routes privées sans authentification : rediriger vers login
    next('/login');
  } else {
    next();
  }
});

export default router
