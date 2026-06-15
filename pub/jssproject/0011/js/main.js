import { GameManager } from './game_manager.js';

window.addEventListener('load', () => {
    const manager = new GameManager();
    manager.start();
});
