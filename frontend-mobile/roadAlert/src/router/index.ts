import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
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

  // Si la route nécessite une authentification
  if (to.path !== '/login' && !isAuthenticated) {
    // Rediriger vers login
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    // Si déjà connecté et essaie d'aller sur login, rediriger vers dashboard
    next('/dashboard');
  } else {
    next();
  }
});

export default router
