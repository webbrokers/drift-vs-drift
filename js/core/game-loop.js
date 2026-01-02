/**
 * GameLoop - Сердце движка с Fixed Timestep
 */

class GameLoop {
    constructor(updateCallback, renderCallback) {
        this.update = updateCallback;
        this.render = renderCallback;
        
        this.FIXED_TIMESTEP = 1000 / 60; // 60 Hz
        this.accumulator = 0;
        this.lastTime = 0;
        this.isRunning = false;
        
        this.loop = this.loop.bind(this);
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }
    
    stop() {
        this.isRunning = false;
    }
    
    loop(currentTime) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Ограничиваем максимальный deltaTime, чтобы избежать "спирали смерти"
        // если вкладка была неактивна
        const frameTime = Math.min(deltaTime, 250); 
        this.accumulator += frameTime;
        
        // Фиксированные обновления физики
        while (this.accumulator >= this.FIXED_TIMESTEP) {
            this.update(this.FIXED_TIMESTEP / 1000); // передаем время в секундах
            this.accumulator -= this.FIXED_TIMESTEP;
        }
        
        // Рендеринг с фактором интерполяции для плавности
        const alpha = this.accumulator / this.FIXED_TIMESTEP;
        this.render(alpha);
        
        requestAnimationFrame(this.loop);
    }
}

// Экспортируем для использования в main.js
window.GameLoop = GameLoop;
