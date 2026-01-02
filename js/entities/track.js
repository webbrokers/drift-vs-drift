/**
 * Track - Класс трассы (процедурная генерация фигуры "8")
 */

class Track {
    constructor() {
        this.points = [];
        this.width = 200; // Базовая ширина
        this.segments = 100; // Количество сегментов для плавности
        
        this.generate();
    }
    
    generate() {
        this.points = [];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const scaleX = window.innerWidth * 0.4;
        const scaleY = window.innerHeight * 0.35;
        
        for (let i = 0; i <= this.segments; i++) {
            const t = (i / this.segments) * Math.PI * 2;
            
            // Фигура Лемниската Бернулли (Восьмерка)
            // Формула: x = a*cos(t) / (1 + sin^2(t)), y = a*sin(t)*cos(t) / (1 + sin^2(t))
            const denominator = 1 + Math.pow(Math.sin(t), 2);
            const x = centerX + (scaleX * Math.cos(t)) / denominator;
            const y = centerY + (scaleX * Math.sin(t) * Math.cos(t)) / denominator;
            
            // Вариативная ширина трассы
            const currentWidth = 180 + Math.sin(t * 2) * 40;
            
            this.points.push({ x, y, width: currentWidth });
        }
    }
    
    draw(ctx) {
        if (this.points.length < 2) return;
        
        // 1. Отрисовка травы (фон уже темный, так что просто заливка вокруг)
        // Но в идеале трасса рисуется поверх фона.
        
        // 2. Отрисовка асфальта
        this.drawPath(ctx, 1.2, '#222'); // Чуть шире для обочины
        this.drawPath(ctx, 1.0, '#333'); // Основной асфальт
        
        // 3. Разметка (центральная линия)
        ctx.setLineDash([20, 20]);
        this.drawPath(ctx, 0.02, '#fff');
        ctx.setLineDash([]);
        
        // 4. Поребрики (Curbs) на поворотах
        this.drawCurbs(ctx);
    }
    
    drawPath(ctx, widthMultiplier, color) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            const p = this.points[i];
            ctx.lineWidth = p.width * widthMultiplier;
            ctx.lineTo(p.x, p.y);
            ctx.stroke(); // Рисуем сегментами, чтобы ширина могла меняться
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
        }
    }
    
    drawCurbs(ctx) {
        // Отрисовка красно-белых поребриков по краям
        // Для MVP сделаем упрощенную отрисовку границ
        ctx.lineWidth = 10;
        
        for (let i = 0; i < this.points.length - 1; i++) {
            const p1 = this.points[i];
            const p2 = this.points[i+1];
            
            // Расчет вектора нормали для смещения к краям
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const len = Math.sqrt(dx*dx + dy*dy);
            const nx = -dy / len;
            const ny = dx / len;
            
            const w = p1.width / 2;
            
            // Левый край
            ctx.strokeStyle = (i % 2 === 0) ? '#ff0000' : '#ffffff';
            ctx.beginPath();
            ctx.moveTo(p1.x + nx * w, p1.y + ny * w);
            ctx.lineTo(p2.x + nx * w, p2.y + ny * w);
            ctx.stroke();
            
            // Правый край
            ctx.beginPath();
            ctx.moveTo(p1.x - nx * w, p1.y - ny * w);
            ctx.lineTo(p2.x - nx * w, p2.y - ny * w);
            ctx.stroke();
        }
    }
    
    // Простая проверка коллизии (находится ли точка внутри трассы)
    isPointOnTrack(x, y) {
        // Находим ближайший сегмент трассы
        let minPlayerDist = Infinity;
        for (let p of this.points) {
            const dist = window.GameMath.vector.dist({x, y}, p);
            if (dist < minPlayerDist) {
                minPlayerDist = dist;
                if (dist < p.width / 2) return true;
            }
        }
        return false;
    }
}

window.Track = Track;
