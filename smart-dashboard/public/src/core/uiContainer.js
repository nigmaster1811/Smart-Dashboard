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
              <input type="email" name="email" placeholder="demo@smart.local" required />
            </label>
            <label>
              Пароль
              <input type="password" name="password" placeholder="demo1234" required />
            </label>
            <button class="btn btn--primary" type="submit">Войти</button>
            <p class="form-hint">Демо: demo@smart.local / demo1234</p>
          </form>

          <form id="register-form" class="panel">
            <h2>Регистрация</h2>
            <label>
              Имя
              <input type="text" name="name" placeholder="Ваше имя" required />
            </label>
            <label>
              Email
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label>
              Пароль
              <input type="password" name="password" placeholder="Минимум 4 символа" required />
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

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const result = await onLogin(formData.get('email'), formData.get('password'));

    message.textContent = result.ok ? 'Вход выполнен.' : result.error;
    message.className = `auth-message ${result.ok ? 'is-success' : 'is-error'}`;
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const result = await onRegister(
      formData.get('name'),
      formData.get('email'),
      formData.get('password')
    );

    message.textContent = result.ok ? 'Аккаунт создан.' : result.error;
    message.className = `auth-message ${result.ok ? 'is-success' : 'is-error'}`;
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
            <div class="topbar__subtitle">Привет, ${escapeHtml(user.name)}!</div>
          </div>
        </div>

        <div class="topbar__actions">
          <button class="btn btn--small" id="logout-btn" type="button">Выйти</button>
        </div>
      </header>

      <nav class="app-nav">
        ${navButton('/tasks', 'Tasks')}
        ${navButton('/notes', 'Notes')}
        ${navButton('/tracker', 'Tracker')}
      </nav>

      <main class="main-content">
        <div id="module-root" class="module-root"></div>
      </main>

      <footer class="footer">
        <span>Offline-ready PWA</span>
        <span>Core + Modules</span>
      </footer>
    </div>
  `;

  root.querySelectorAll('[data-nav-link]').forEach((btn) => {
    btn.addEventListener('click', () => onNavigate(btn.dataset.route));
  });

  root.querySelector('#logout-btn').addEventListener('click', onLogout);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}