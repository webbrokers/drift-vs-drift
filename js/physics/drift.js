/**
 * DriftSystem - Логика детекции дрифта и расчета очков
 */

const DriftSystem = {
    // Константы из плана
    MIN_DRIFT_ANGLE: 10,        // градусы
    MIN_DRIFT_SPEED: 5 / 3.6,   // м/с (5 км/ч)
    BASE_POINTS_PER_SEC: 100,    // базовые очки (увеличил для интереса)
    
    update(car, dt) {
        const driftState = this.detectDrift(car);
        
        if (driftState.isDrifting) {
            car.driftPointsAccumulator += this.calculatePoints(driftState, dt);
            car.isDrifting = true;
        } else {
            // Если дрифт прерван, очки переходят в общий зачет
            if (car.isDrifting && car.driftPointsAccumulator > 0) {
                car.totalScore += Math.round(car.driftPointsAccumulator);
                car.driftPointsAccumulator = 0;
            }
            car.isDrifting = false;
        }
        
        car.lastDriftState = driftState;
        return driftState;
    },
    
    detectDrift(car) {
        // 1. Расчет угла заноса (slip angle)
        // Угол между направлением движения (velocity) и направлением корпуса
        let slipAngle = 0;
        const velSpeed = window.GameMath.vector.length(car.velocity);
        
        if (velSpeed > 0.5) {
            const courseAngle = Math.atan2(car.velocity.y, car.velocity.x);
            // Нормализуем углы для корректного сравнения (-PI до PI)
            // car.angle у нас: 0 - вверх, PI/2 - вправо
            // Math.atan2: 0 - вправо, PI/2 - вниз. Переводим car.angle в систему atan2
            const carFacingAngle = car.angle - Math.PI / 2;
            
            let diff = courseAngle - carFacingAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            slipAngle = window.GameMath.radToDeg(diff);
        }
        
        // 2. Условия дрифта
        const isDrifting = 
            Math.abs(slipAngle) > this.MIN_DRIFT_ANGLE && 
            velSpeed > this.MIN_DRIFT_SPEED;
            
        return {
            isDrifting,
            slipAngle: Math.abs(slipAngle),
            speed: velSpeed
        };
    },
    
    calculatePoints(driftState, dt) {
        // Множитель угла: 1 + (|slipAngle| / 90) * 0.5
        const angleMultiplier = 1 + (driftState.slipAngle / 90) * 0.5;
        // Множитель скорости (опционально для интереса)
        const speedMultiplier = 1 + (driftState.speed / 50); 
        
        return this.BASE_POINTS_PER_SEC * angleMultiplier * speedMultiplier * dt;
    }
};

window.DriftSystem = DriftSystem;
