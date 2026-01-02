/**
 * Вспомогательные математические функции для игры
 */

const GameMath = {
    // Ограничение значения в диапазоне
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // Линейная интерполяция
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    // Градусы в радианы
    degToRad(deg) {
        return deg * (Math.PI / 180);
    },
    
    // Радианы в градусы
    radToDeg(rad) {
        return rad * (180 / Math.PI);
    },
    
    // Векторные операции
    vector: {
        add(v1, v2) {
            return { x: v1.x + v2.x, y: v1.y + v2.y };
        },
        sub(v1, v2) {
            return { x: v1.x - v2.x, y: v1.y - v2.y };
        },
        mul(v, s) {
            return { x: v.x * s, y: v.y * s };
        },
        length(v) {
            return Math.sqrt(v.x * v.x + v.y * v.y);
        },
        normalize(v) {
            const len = this.length(v);
            return len === 0 ? { x: 0, y: 0 } : { x: v.x / len, y: v.y / len };
        },
        dist(v1, v2) {
            const dx = v1.x - v2.x;
            const dy = v1.y - v2.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }
};

window.GameMath = GameMath;
