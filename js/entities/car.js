/**
 * Класс автомобиля - хранит состояние и логику сущности
 */

class Car {
    constructor(x, y) {
        // Позиция и ориентация
        this.pos = { x: x, y: y };
        this.angle = 0; // в радианах
        
        // Физические параметры (из конфига плана)
        this.config = {
            width: 40,
            height: 80,
            mass: 1200,
            gears: [
                { ratio: 3.5, maxSpeed: 40 },
                { ratio: 2.5, maxSpeed: 70 },
                { ratio: 1.8, maxSpeed: 100 },
                { ratio: 1.3, maxSpeed: 130 },
                { ratio: 1.0, maxSpeed: 160 },
                { ratio: 0.8, maxSpeed: 200 },
                { ratio: -3.0, maxSpeed: -30 }
            ],
            maxSteeringAngle: window.GameMath.degToRad(60),
            steeringSpeed: window.GameMath.degToRad(90)
        };
        
        // Состояние физики
        this.velocity = { x: 0, y: 0 };
        this.speed = 0; // линейная скорость вдоль направления
        this.angularVelocity = 0;
        this.steeringAngle = 0;
        this.currentGear = 0; // 0 - Нейтраль
        this.rpm = 800; // Холостые
        
        // Управление
        this.controls = {
            throttle: 0,
            brake: 0,
            handbrake: false,
            clutch: false
        };
        
        // Вспомогательные состояния для физики
        this.lastClutchState = false;
        this.lastRpmBeforeClutchRelease = 800;
        this.lastGearUpPressed = false;
        this.lastGearDownPressed = false;
        
        // Очки и состояние дрифта
        this.totalScore = 0;
        this.driftPointsAccumulator = 0;
        this.isDrifting = false;
    }
    
    update(dt) {
        // Логика обновления будет в CarPhysics
        window.CarPhysics.update(this, dt);
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.angle);
        
        // Рисуем корпус автомобиля
        ctx.fillStyle = this.isDrifting ? '#ffaa00' : '#ff4444'; // Оранжевый в дрифте
        ctx.fillRect(-this.config.width / 2, -this.config.height / 2, this.config.width, this.config.height);
        
        // Спойлер (задняя часть)
        ctx.fillStyle = '#111';
        ctx.fillRect(-this.config.width / 2 - 2.5, this.config.height / 2 - 5, this.config.width + 5, 7.5);
        
        // Фары (передняя часть)
        ctx.fillStyle = '#fffabc'; // Свет фар
        ctx.fillRect(-this.config.width / 2 + 2.5, -this.config.height / 2, 7.5, 2.5);
        ctx.fillRect(this.config.width / 2 - 10, -this.config.height / 2, 7.5, 2.5);

        // Если в дрифте, рисуем небольшую обводку для эффекта
        if (this.isDrifting) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.config.width / 2, -this.config.height / 2, this.config.width, this.config.height);
        }
        
        // Колеса (визуализация поворота)
        this.drawWheel(ctx, -this.config.width / 2 - 2.5, -this.config.height / 2 + 15, this.steeringAngle); // ЛП
        this.drawWheel(ctx, this.config.width / 2 + 2.5, -this.config.height / 2 + 15, this.steeringAngle);  // ПП
        this.drawWheel(ctx, -this.config.width / 2 - 2.5, this.config.height / 2 - 15, 0);                 // ЛЗ
        this.drawWheel(ctx, this.config.width / 2 + 2.5, this.config.height / 2 - 15, 0);                  // ПЗ
        
        ctx.restore();
    }
    
    drawWheel(ctx, x, y, angle) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = '#888'; // Светлые колеса для контраста
        ctx.fillRect(-5, -10, 10, 20);
        ctx.restore();
    }
}

window.Car = Car;
