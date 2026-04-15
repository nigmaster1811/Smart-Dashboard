import { authService } from './core/authService.js';
import { dataService } from './core/dataService.js';
import { notificationService } from './core/notificationService.js';
import { renderAuthScreen, renderAppShell } from './core/uiContainer.js';
import { Router } from './core/router.js';

import { tasksModule } from './modules/tasks/tasks.js';
import { notesModule } from './modules/notes/notes.js';
import { trackerModule } from './modules/tracker/tracker.js';

const app = document.getElementById('app');

const modules = {
  tasks: tasksModule,
  notes: notesModule,
  tracker: trackerModule
};

const router = new Router({
  modules,
  onRouteRendered: async (route, user, moduleRoot) => {
    const moduleApi = modules[route];
    if (!moduleApi) return;

    await moduleApi.render({
      root: moduleRoot,
      user,
      dataService,
      notificationService,
      onDataChanged: () => {
        renderShell();
        router.refresh();
      }
    });
  }
});

function renderShell() {
  const user = authService.getCurrentUser();

  if (!user) {
    renderAuthScreen(app, {
      onLogin: async (email, password) => {
        const result = authService.login(email, password);
        if (!result.ok) return result;
        renderShell();
        router.go('/tasks');
        return result;
      },
      onRegister: async (name, email, password) => {
        const result = authService.register({ name, email, password });
        if (!result.ok) return result;
        renderShell();
        router.go('/tasks');
        return result;
      }
    });
    return;
  }

  renderAppShell(app, {
    user,
    onLogout: () => {
      authService.logout();
      renderShell();
    },
    onNavigate: (path) => router.go(path)
  });

  router.attach(document.getElementById('module-root'), user);
  router.refresh();
}

async function boot() {
  authService.seedDemoUserIfEmpty();
  renderShell();

  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/src/serviceWorker.js');
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  }
}

boot();