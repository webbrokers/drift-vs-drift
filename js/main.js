/**
 * Drift Infinity - Основной файл запуска
 */

let gameLoop;
let renderer;
let playerCar;
let track;

document.addEventListener("DOMContentLoaded", () => {
  console.log("Drift Infinity: Инициализация...");

  renderer = new window.Renderer("gameCanvas");
  track = new window.Track();
  // Старт слева: CenterX - ScaleX (где ScaleX = width * 0.4)
  // CenterX = width / 2. Итого: width * 0.5 - width * 0.4 = width * 0.1
  playerCar = new window.Car(window.innerWidth * 0.1, window.innerHeight / 2);

  // Инициализация игрового цикла
  gameLoop = new window.GameLoop(update, render);

  Menu.init();
  HUD.init();

  const startBtn = document.getElementById("start-btn");
  const menuOverlay = document.getElementById("menu-overlay");

  startBtn.addEventListener("click", () => {
    menuOverlay.style.display = "none";
    window.track = track; // Глобальный доступ для физики
    window.AudioManager.init(); // Инициализация звука по клику
    gameLoop.start();
    console.log("Игра запущена");
  });
});

function update(dt) {
  playerCar.update(dt);
  window.HUD.update(playerCar);
  window.AudioManager.update(playerCar);
}

function render(alpha) {
  renderer.clear();
  track.draw(renderer.ctx);
  playerCar.draw(renderer.ctx);
}
