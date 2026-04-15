import { notificationService } from '../../core/notificationService.js';

export function renderNotesView({ root, user, dataService, onDataChanged }) {
  const dashboard = dataService.getDashboard(user.id);
  const notes = dataService.getNotes(user.id);

  root.innerHTML = `
    <section class="module">
      <header class="module__header">
        <div>
          <h2>Notes</h2>
          <p>Идеи, напоминания и быстрые записи</p>
        </div>
        <div class="module__score">+${dashboard.notesCount} notes</div>
      </header>

      <div class="module-grid">
        <form id="note-form" class="panel">
          <h3>Новая заметка</h3>
          <label>
            Содержимое
            <textarea name="content" rows="7" placeholder="Запишите мысль или напоминание..." required></textarea>
          </label>

          <label>
            Тип
            <select name="type">
              <option value="text">Текстовая заметка</option>
              <option value="reminder">Напоминание</option>
            </select>
          </label>

          <label>
            Баллы
            <input name="points" type="number" min="1" value="3" />
          </label>

          <button class="btn btn--primary" type="submit">Сохранить</button>
        </form>

        <div class="panel">
          <div class="stats-row">
            <div class="mini-stat">
              <span>Заметок</span>
              <strong>${dashboard.notesCount}</strong>
            </div>
            <div class="mini-stat">
              <span>Баллы</span>
              <strong>${dashboard.profile.totalPoints}</strong>
            </div>
            <div class="mini-stat">
              <span>Уровень</span>
              <strong>${dashboard.profile.level}</strong>
            </div>
          </div>

          <div class="note-list" id="note-list">
            ${
              notes.length
                ? notes
                    .map(
                      (note) => `
                  <article class="note-card">
                    <div class="note-card__text">${escapeHtml(note.content)}</div>
                    <div class="note-card__meta">
                      <span>${note.type}</span>
                      <span>${note.date}</span>
                      <span>+${note.points}</span>
                    </div>
                    <div class="task-card__actions">
                      <button class="btn btn--small" data-action="edit" data-id="${note.id}" type="button">Ред.</button>
                      <button class="btn btn--small btn--danger" data-action="delete" data-id="${note.id}" type="button">Удалить</button>
                    </div>
                  </article>
                `
                    )
                    .join('')
                : `<div class="empty-state">Пока нет заметок. Создайте первую справа.</div>`
            }
          </div>
        </div>
      </div>
    </section>
  `;

  const form = root.querySelector('#note-form');
  const list = root.querySelector('#note-list');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fd = new FormData(form);

    const result = dataService.createNote(user.id, {
      content: fd.get('content'),
      type: fd.get('type'),
      points: fd.get('points')
    });

    if (!result.ok) return notificationService.error(result.error);

    notificationService.success('Заметка сохранена');
    form.reset();
    onDataChanged();
  });

  list.addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    if (action === 'delete') {
      const result = dataService.deleteNote(user.id, id);
      if (!result.ok) return notificationService.error(result.error);
      notificationService.warn('Заметка удалена');
      onDataChanged();
      return;
    }

    if (action === 'edit') {
      const note = dataService.getNotes(user.id).find((item) => item.id === id);
      if (!note) return;

      const content = prompt('Редактировать заметку', note.content);
      if (content === null) return;

      const type = prompt('Тип: text / reminder', note.type) ?? note.type;

      const result = dataService.updateNote(user.id, id, { content, type });
      if (!result.ok) return notificationService.error(result.error);

      notificationService.success('Заметка обновлена');
      onDataChanged();
    }
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