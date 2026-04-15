import { renderNotesView } from './notesUI.js';

export const notesModule = {
  async render(ctx) {
    renderNotesView(ctx);
  }
};