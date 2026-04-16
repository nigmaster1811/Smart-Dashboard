function navButton(route, label) {
  return `
    <button class="nav-link" data-nav-link data-route="${route}" type="button">
      ${label}
    </button>
  `;
}

export function renderAuthScreen(root, { onLogin, onRegister }) {
  root.innerHTML = `
    <main class="auth-screen">
      <section class="auth-card">
        <div class="brand">
          <div class="brand__icon">◎</div>
          <div>
            <h1>Smart Dashboard</h1>
            <p>Задачи, заметки и прогресс в одном месте</p>
          </div>
        </div>

        <div class="auth-grid">
          <form id="login-form" class="panel">
            <h2>Вход</h2>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            <label>
              Пароль
              <input type="password" name="password" required />
            </label>
            <button class="btn btn--primary" type="submit">Войти</button>
          </form>

          <form id="register-form" class="panel">
            <h2>Регистрация</h2>
            <label>
              Имя
              <input type="text" name="name" required />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            <label>
              Пароль
              <input type="password" name="password" required />
            </label>
            <button class="btn btn--ghost" type="submit">Создать аккаунт</button>
          </form>
        </div>

        <div id="auth-message" class="auth-message"></div>
      </section>
    </main>
  `;

  const loginForm = root.querySelector('#login-form');
  const registerForm = root.querySelector('#register-form');
  const message = root.querySelector('#auth-message');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(loginForm);
    const result = await onLogin(
      data.get('email'),
      data.get('password')
    );

    message.textContent = result.ok ? 'Вход выполнен' : result.error;
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(registerForm);
    const result = await onRegister(
      data.get('name'),
      data.get('email'),
      data.get('password')
    );

    message.textContent = result.ok ? 'Аккаунт создан' : result.error;
  });
}

export function renderAppShell(root, { user, onLogout, onNavigate }) {
  root.innerHTML = `
    <div class="app-shell">

      <header class="topbar">
        <div class="topbar__brand">
          <div class="brand__icon">◎</div>
          <div>
            <strong>Smart Dashboard</strong>
            <div class="topbar__subtitle">
              Привет, ${escapeHtml(user.name)}!
            </div>
          </div>
        </div>

        <div class="topbar__actions">
          <div class="points-pill" id="points-pill">0 pts</div>
          <button class="btn btn--small" id="logout-btn">Выйти</button>
        </div>
      </header>

      <nav class="app-nav">
        ${navButton('/tasks', 'Tasks')}
        ${navButton('/notes', 'Notes')}
        ${navButton('/tracker', 'Tracker')}
      </nav>

      <main class="main-content">
        <div id="module-root"></div>
      </main>

      <footer class="footer">
        Offline-ready PWA
      </footer>
    </div>
  `;

  root.querySelector('#logout-btn').addEventListener('click', onLogout);

  root.querySelectorAll('[data-nav-link]').forEach(btn => {
    btn.addEventListener('click', () =>
      onNavigate(btn.dataset.route)
    );
  });

  const ptsEl = root.querySelector('#points-pill');

  function updatePTS() {
    const session = JSON.parse(localStorage.getItem('smart-dashboard-session-v1'));
    if (!session) return;

    const pts = JSON.parse(localStorage.getItem('smart-dashboard-pts-v1')) || {};
    ptsEl.textContent = `${pts[session.id] ?? 0} pts`;
  }

  updatePTS();
  window.addEventListener('ptsUpdated', updatePTS);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}