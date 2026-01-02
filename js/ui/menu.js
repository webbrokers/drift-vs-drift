/**
 * Menu - Управление экранами меню и логикой игры
 */

const Menu = {
    elements: {},
    isInitialized: false,
    
    init() {
        if (this.isInitialized) return;
        
        this.elements = {
            overlay: document.getElementById('menu-overlay'),
            startBtn: document.getElementById('start-btn'),
            settingsBtn: document.getElementById('settings-btn'),
            score: document.getElementById('score')
        };
        
        this.isInitialized = true;
    },
    
    showGameOver(finalScore) {
        // Создаем экран Game Over динамически или используем существующий
        const overlay = this.elements.overlay;
        overlay.style.display = 'flex';
        
        const content = overlay.querySelector('.menu-content');
        content.innerHTML = `
            <h1>Game Over</h1>
            <p>Ваш результат: ${Math.round(finalScore)}</p>
            <p>Рекорд: ${this.getBestScore()}</p>
            <button id="restart-btn">Попробовать снова</button>
            <button id="menu-btn">В главное меню</button>
        `;
        
        this.saveScore(finalScore);
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            location.reload(); // Простой способ перезапуска для MVP
        });
    },
    
    saveScore(score) {
        const best = this.getBestScore();
        if (score > best) {
            window.Storage.save('best_score', Math.round(score));
        }
    },
    
    getBestScore() {
        return window.Storage.load('best_score') || 0;
    }
};

window.Menu = Menu;
