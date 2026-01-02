/**
 * Обработка ввода с клавиатуры
 */

class Input {
    constructor() {
        this.keys = {};
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            // Предотвращаем прокрутку страницы стрелками
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    isPressed(code) {
        return !!this.keys[code];
    }
}

window.Input = new Input();
