export class Router {
  constructor({ modules, onRouteRendered }) {
    this.modules = modules;
    this.onRouteRendered = onRouteRendered;
    this.moduleRoot = null;
    this.user = null;
    this.currentRoute = this.getRouteFromHash();

    window.addEventListener('hashchange', () => this.refresh());
  }

  attach(moduleRoot, user) {
    this.moduleRoot = moduleRoot;
    this.user = user;
  }

  getRouteFromHash() {
    const raw = location.hash.replace('#', '').trim();
    const route = raw.startsWith('/') ? raw : '/tasks';
    return route === '/' ? '/tasks' : route;
  }

  go(path) {
    location.hash = `#${path}`;
  }

  refresh() {
    if (!this.moduleRoot || !this.user) return;

    const route = this.getRouteFromHash().replace('/', '');
    const safeRoute = this.modules[route] ? route : 'tasks';
    this.currentRoute = `/${safeRoute}`;

    this.renderActiveNav(this.currentRoute);
    this.moduleRoot.innerHTML = '';
    this.onRouteRendered(safeRoute, this.user, this.moduleRoot);
  }

  renderActiveNav(route) {
    document.querySelectorAll('[data-nav-link]').forEach((el) => {
      el.classList.toggle('is-active', el.dataset.route === route);
    });
  }
}