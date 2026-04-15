import { notificationService } from '../../core/notificationService.js';

const typeLabels = {
  home: 'Быт',
  health: 'Здоровье',
  custom: 'Кастом'
};

const statusLabels = {
  todo: 'Не выполнено',
  done: 'Выполнено',
  missed: 'Пропущено'
};

export function renderTasksView({ root, user, dataService, onDataChanged }) {
  const dashboard = dataService.getDashboard(user.id);
  const tasks = dataService.getTasks(user.id);

  root.innerHTML = `
    <section class="module">
      <header class="module__header">
        <div>
          <h2>Tasks</h2>
          <p>Задачи, привычки и ежедневные активности</p>
        </div>
        <div class="module__score">+${dashboard.profile.totalPoints} pts</div>
      </header>

      <div class="module-grid">
        <form id="task-form" class="panel">
          <h3>Новая задача</h3>
          <label>
            Название
            <input name="title" type="text" placeholder="Например: выпить воду" required />
          </label>

          <label>
            Тип
            <select name="type">
              <option value="home">Бытовая</option>
              <option value="health">Здоровье</option>
              <option value="custom">Кастомная</option>
            </select>
          </label>

          <label>
            Дата
            <input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" />
          </label>

          <label>
            Баллы
            <input name="points" type="number" min="1" value="10" />
          </label>

          <button class="btn btn--primary" type="submit">Добавить</button>
        </form>

        <div class="panel">
          <div class="stats-row">
            <div class="mini-stat">
              <span>Всего</span>
              <strong>${dashboard.tasksCount}</strong>
            </div>
            <div class="mini-stat">
              <span>Готово</span>
              <strong>${dashboard.completedTasks}</strong>
            </div>
            <div class="mini-stat">
              <span>Стрик</span>
              <strong>${dashboard.bestStreak}</strong>
            </div>
          </div>

          <div class="task-list" id="task-list">
            ${
              tasks.length
                ? tasks
                    .map(
                      (task) => `
                  <article class="task-card task-card--${task.status}">
                    <div class="task-card__top">
                      <div>
                        <h4>${escapeHtml(task.title)}</h4>
                        <p>${typeLabels[task.type] || task.type} · ${task.date}</p>
                      </div>
                      <span class="badge">${statusLabels[task.status] || task.status}</span>
                    </div>

                    <div class="task-card__meta">
                      <span>Баллы: ${task.points}</span>
                      <span>Стрик: ${task.streak || 0}</span>
                    </div>

                    <div class="task-card__actions">
                      <select data-action="status" data-id="${task.id}">
                        <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Не выполнено</option>
                        <option value="done" ${task.status === 'done' ? 'selected' : ''}>Выполнено</option>
                        <option value="missed" ${task.status === 'missed' ? 'selected' : ''}>Пропущено</option>
                      </select>

                      <button class="btn btn--small" data-action="edit" data-id="${task.id}" type="button">Ред.</button>
                      <button class="btn btn--small btn--danger" data-action="delete" data-id="${task.id}" type="button">Удалить</button>
                    </div>
                  </article>
                `
                    )
                    .join('')
                : `<div class="empty-state">Пока нет задач. Добавьте первую справа.</div>`
            }
          </div>
        </div>
      </div>
    </section>
  `;

  const form = root.querySelector('#task-form');
  const list = root.querySelector('#task-list');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(form);

    const result = dataService.createTask(user.id, {
      title: fd.get('title'),
      type: fd.get('type'),
      date: fd.get('date'),
      points: fd.get('points')
    });

    if (!result.ok) return notificationService.error(result.error);

    notificationService.success('Задача добавлена');
    form.reset();
    onDataChanged();
  });

  list.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
      const result = dataService.deleteTask(user.id, id);
      if (!result.ok) return notificationService.error(result.error);
      notificationService.warn('Задача удалена');
      onDataChanged();
      return;
    }

    if (action === 'edit') {
      const task = dataService.getTasks(user.id).find((item) => item.id === id);
      if (!task) return;

      const title = prompt('Новое название задачи', task.title);
      if (title === null) return;

      const type = prompt('Тип: home / health / custom', task.type) ?? task.type;
      const points = prompt('Баллы', String(task.points)) ?? String(task.points);

      const result = dataService.updateTask(user.id, id, {
        title,
        type,
        points: Number(points)
      });

      if (!result.ok) return notificationService.error(result.error);
      notificationService.success('Задача обновлена');
      onDataChanged();
    }
  });

  list.addEventListener('change', (event) => {
    const select = event.target.closest('select[data-action="status"]');
    if (!select) return;

    const result = dataService.setTaskStatus(user.id, select.dataset.id, select.value);
    if (!result.ok) return notificationService.error(result.error);

    if (select.value === 'done' && result.earned > 0) {
      notificationService.success(`+${result.earned} pts`);
    } else if (select.value === 'missed') {
      notificationService.warn('Отмечено как пропущено');
    }
    onDataChanged();
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}