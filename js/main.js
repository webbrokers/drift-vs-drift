/**
 * Drift Infinity - Основной файл запуска
 */

let gameLoop;
let renderer;
let playerCar;
let track;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Drift Infinity: Инициализация...');
    
    renderer = new window.Renderer('gameCanvas');
    track = new window.Track();
    playerCar = new window.Car(window.innerWidth / 2, window.innerHeight / 2);
    
    Menu.init();
    HUD.init();
    
    const startBtn = document.getElementById('start-btn');
    const menuOverlay = document.getElementById('menu-overlay');

    startBtn.addEventListener('click', () => {
        menuOverlay.style.display = 'none';
        window.track = track; // Глобальный доступ для физики
        window.AudioManager.init(); // Инициализация звука по клику
        gameLoop.start();
        console.log('Игра запущена');
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
