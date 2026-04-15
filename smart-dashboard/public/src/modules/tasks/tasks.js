import { renderTasksView } from './tasksUI.js';

export const tasksModule = {
  async render(ctx) {
    renderTasksView(ctx);
  }
};