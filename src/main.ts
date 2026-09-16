import './style.css';
import { Engine } from './core/Engine';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas #game-canvas not found!');
    return;
  }

  // Prevent context menu on right click
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Initialize and start Beat 'Em Up Engine
  const engine = new Engine(canvas);
  engine.start();

  console.log('TP FINAL: CONTRA EL TIEMPO - Engine iniciado con éxito.');
});
