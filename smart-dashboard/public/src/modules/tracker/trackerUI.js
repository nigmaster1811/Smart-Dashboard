export function renderTrackerView({ root, user, dataService }) {
  const dashboard = dataService.getDashboard(user.id);

  const mascotMood = getMascotMood(dashboard.profile.totalPoints, dashboard.bestStreak, dashboard.completedTasks);
  const badges = dashboard.profile.badges || [];

  root.innerHTML = `
    <section class="module">
      <header class="module__header">
        <div>
          <h2>Activity Tracker</h2>
          <p>Прогресс, достижения и визуальная обратная связь</p>
        </div>
        <div class="module__score">Level ${dashboard.profile.level}</div>
      </header>

      <div class="tracker-grid">
        <div class="panel tracker-hero">
          <div class="mascot">
            <div class="mascot__face">${mascotMood.emoji}</div>
            <div>
              <h3>${mascotMood.title}</h3>
              <p>${mascotMood.text}</p>
            </div>
          </div>

          <div class="progress-block">
            <div class="progress-label">
              <span>Общие баллы</span>
              <strong>${dashboard.profile.totalPoints}</strong>
            </div>
            <div class="progress-bar">
              <div class="progress-bar__fill" style="width:${Math.min(100, dashboard.profile.totalPoints % 100)}%"></div>
            </div>
            <small>До следующего уровня: ${100 - (dashboard.profile.totalPoints % 100)} pts</small>
          </div>

          <div class="badges">
            ${badges.length ? badges.map((badge) => `<span class="badge badge--accent">${badge}</span>`).join('') : '<span class="empty-inline">Пока без бейджей</span>'}
          </div>
        </div>

        <div class="panel">
          <h3>Ключевые метрики</h3>
          <div class="stats-grid">
            <div class="metric">
              <span>Tasks</span>
              <strong>${dashboard.tasksCount}</strong>
            </div>
            <div class="metric">
              <span>Done</span>
              <strong>${dashboard.completedTasks}</strong>
            </div>
            <div class="metric">
              <span>Missed</span>
              <strong>${dashboard.missedTasks}</strong>
            </div>
            <div class="metric">
              <span>Notes</span>
              <strong>${dashboard.notesCount}</strong>
            </div>
          </div>

          <div class="chart-card">
            <h4>Статусы задач</h4>
            <div class="donut" style="--done:${pct(dashboard.completedTasks, dashboard.tasksCount)}; --missed:${pct(dashboard.missedTasks, dashboard.tasksCount)};">
              <div class="donut__center">
                <strong>${pct(dashboard.completedTasks, dashboard.tasksCount)}%</strong>
                <span>done</span>
              </div>
            </div>
            <div class="chart-legend">
              <span><i class="dot dot--done"></i> Выполнено: ${dashboard.completedTasks}</span>
              <span><i class="dot dot--todo"></i> Не выполнено: ${dashboard.todoTasks}</span>
              <span><i class="dot dot--missed"></i> Пропущено: ${dashboard.missedTasks}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <h3>Последние события</h3>
          <div class="activity-list">
            ${
              dashboard.recentLogs.length
                ? dashboard.recentLogs.map((log) => `
                    <div class="activity-item">
                      <strong>${labelForAction(log.action)}</strong>
                      <span>${log.pointsEarned ? `+${log.pointsEarned} pts` : '0 pts'}</span>
                      <small>${formatDate(log.timestamp)}</small>
                    </div>
                  `).join('')
                : '<div class="empty-state">Пока нет активности</div>'
            }
          </div>
        </div>
      </div>
    </section>
  `;
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function getMascotMood(points, streak, completed) {
  if (points >= 100 || streak >= 5 || completed >= 10) {
    return {
      emoji: '✨',
      title: 'Отличный темп!',
      text: 'Вы стабильно двигаетесь вперёд. Продолжайте в том же духе.'
    };
  }

  if (completed > 0) {
    return {
      emoji: '🙂',
      title: 'Хороший старт!',
      text: 'Уже есть прогресс. Давайте закрепим привычку.'
    };
  }

  return {
    emoji: '🌱',
    title: 'Новый день — новая серия',
    text: 'Начните с одной маленькой задачи, и баллы быстро пойдут вверх.'
  };
}

function labelForAction(action) {
  const map = {
    task_created: 'Задача создана',
    task_updated: 'Задача обновлена',
    task_deleted: 'Задача удалена',
    task_status_changed: 'Статус задачи изменён',
    note_created: 'Заметка создана',
    note_updated: 'Заметка обновлена',
    note_deleted: 'Заметка удалена'
  };
  return map[action] || action;
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('ru-RU');
}