/**
 * CarPhysics2D - Аркадно-реалистичная физика автомобиля (Bicycle Model)
 * Реализация включает: Slip Angles, Yaw Moment, Перенос веса, Сцепление.
 */

class CarPhysics2D {
    constructor() {
        // Настройки тюнинга (Tuning)
        this.tuning = {
            mass: 1200,                // Масса кг
            wheelbase: 80,             // Колесная база (расстояние между осями)
            distFront: 40,             // Центр масс до передней оси
            distRear: 40,              // Центр масс до задней оси
            cgHeight: 0.55,            // Высота центра масс (для переноса веса)
            
            maxSteerAngle: Math.PI / 3, // 60 градусов
            steerSpeed: 4.0,           // Скорость поворота руля
            steerReturn: 8.0,          // Скорость возврата руля
            
            engineForce: 8000,         // Сила двигателя
            brakeForce: 12000,         // Сила торможения
            handbrakeStrength: 0.2,    // Множитель бокового зацепа при ручнике
            
            // Жесткость шин (Cornering Stiffness)
            // Эти параметры определяют "дрифтовость"
            stiffnessFront: 5.0,       // Зацеп спереди
            stiffnessRear: 4.5,        // Зацеп сзади (чуть меньше для инициации)
            
            rollResist: 4.0,           // Сопротивление качению
            airDrag: 0.15,             // Сопротивление воздуха
            
            angularDamping: 2.0,       // Гашение вращения
            maxSpeed: 1000,            // Макс скорость (px/s)
            
            inertia: 1500,             // Момент инерции (сопротивление развороту корпуса)
        };
    }

    update(car, dt) {
        const input = window.Input;
        
        // 1. Обработка ввода и рулевого управления
        this._updateInput(car, dt);
        
        // 2. Локальные векторы
        const sn = Math.sin(car.angle);
        const cs = Math.cos(car.angle);
        
        // Forward: (sin, -cos) для top-down (0 вверх)
        const forward = { x: sn, y: -cs };
        const right = { x: cs, y: sn };
        
        // Локальные скорости (World -> Local)
        const vForward = car.velocity.x * forward.x + car.velocity.y * forward.y;
        const vRight = car.velocity.x * right.x + car.velocity.y * right.y;
        
        // 3. Вычисление Slip Angles (Углы увода шин)
        // bicycle model: alpha = atan2(vLateral + yawRate * dist, vForward) - steer
        // Добавляем защиту от деления на ноль на малых скоростях
        const absVForward = Math.abs(vForward);
        let alphaFront = 0;
        let alphaRear = 0;
        
        if (absVForward > 10) {
            alphaFront = Math.atan2(vRight + car.angularVelocity * this.tuning.distFront, absVForward) - car.steeringAngle * Math.sign(vForward);
            alphaRear = Math.atan2(vRight - car.angularVelocity * this.tuning.distRear, absVForward);
        }

        // 4. Перенос веса (Weight Transfer)
        // Упрощенный: акцент на продольное ускорение
        const longAccel = (vForward - (car.lastVForward || 0)) / dt;
        car.lastVForward = vForward;
        
        const weightBase = this.tuning.mass * 0.5;
        const weightTransfer = (longAccel / 10) * (this.tuning.cgHeight / this.tuning.wheelbase) * this.tuning.mass;
        
        const weightFront = weightBase - weightTransfer;
        const weightRear = weightBase + weightTransfer;

        // 5. Боковые силы (Lateral Forces)
        let gripRearMult = 1.0;
        if (car.controls.handbrake) {
            gripRearMult = this.tuning.handbrakeStrength;
        }

        // F = -stiffness * alpha * weight
        const fLatFront = -this.tuning.stiffnessFront * alphaFront * Math.max(0, weightFront);
        const fLatRear = -this.tuning.stiffnessRear * alphaRear * Math.max(0, weightRear) * gripRearMult;

        // 6. Продольные силы (Longitudinal Forces)
        let tractionForce = 0;
        const isClutchFree = car.controls.clutch || car.currentGear === 0;
        
        if (!isClutchFree) {
            const gear = car.config.gears[car.currentGear - 1];
            if (gear) {
                // Плавная передача момента
                const throttle = car.controls.throttle;
                tractionForce = throttle * this.tuning.engineForce * (gear.ratio / 3.0);
                
                // Эффект Clutch Kick (кратковременное падение зацепа при отпускании сцепления на оборотах)
                if (car.clutchKickTimer > 0) {
                    gripRearMult *= 0.5;
                }
            }
        }

        const braking = car.controls.brake * this.tuning.brakeForce;
        const drag = vForward * this.tuning.airDrag + Math.sign(vForward) * this.tuning.rollResist;
        
        const fLong = tractionForce - (Math.sign(vForward) * braking) - drag;

        // 7. Расчет ускорений и Yaw Moment
        // Yaw Moment = F_front * d_front - F_rear * d_rear
        const yawMoment = fLatFront * this.tuning.distFront - fLatRear * this.tuning.distRear;
        
        // Угловое ускорение: alpha = Moment / Inertia
        const angularAccel = yawMoment / this.tuning.inertia;
        
        car.angularVelocity += angularAccel * dt;
        // Демпфирование для стабильности
        car.angularVelocity *= Math.pow(1.0 - this.tuning.angularDamping * dt, 1);
        
        // Линейное ускорение (Локальное)
        const accelForward = fLong / this.tuning.mass;
        const accelRight = (fLatFront + fLatRear) / this.tuning.mass;
        
        // World Velocity Update
        car.velocity.x += (forward.x * accelForward + right.x * accelRight) * dt;
        car.velocity.y += (forward.y * accelForward + right.y * accelRight) * dt;
        
        // Update Angle and Position
        car.angle += car.angularVelocity * dt;
        car.pos.x += car.velocity.x * dt;
        car.pos.y += car.velocity.y * dt;
        
        // 8. Обновление RPM и прочего состояния для HUD
        car.speed = vForward;
        this._updateEngine(car, dt);
        
        // Состояние для дрифта (Slip Angle для DriftSystem)
        const totalSlip = Math.abs(alphaRear) * (180 / Math.PI);
        car.isDrifting = totalSlip > 15 && absVForward > 100;
        
        // Для отладки
        car.debugGrip = { front: weightFront, rear: weightRear, alphaR: totalSlip };
    }

    _updateInput(car, dt) {
        const input = window.Input;
        
        car.controls.throttle = (input.isPressed('ArrowUp') || input.isPressed('KeyW')) ? 1 : 0;
        car.controls.brake = (input.isPressed('ArrowDown') || input.isPressed('KeyS')) ? 1 : 0;
        car.controls.handbrake = input.isPressed('Space');
        car.controls.clutch = input.isPressed('AltLeft') || input.isPressed('KeyZ');
        
        // Руление
        let targetSteer = 0;
        if (input.isPressed('ArrowLeft') || input.isPressed('KeyA')) targetSteer = -this.tuning.maxSteerAngle;
        if (input.isPressed('ArrowRight') || input.isPressed('KeyD')) targetSteer = this.tuning.maxSteerAngle;
        
        const steerDiff = targetSteer - car.steeringAngle;
        const speed = (targetSteer === 0) ? this.tuning.steerReturn : this.tuning.steerSpeed;
        car.steeringAngle += Math.sign(steerDiff) * Math.min(Math.abs(steerDiff), speed * dt);
    }

    _updateEngine(car, dt) {
        const input = window.Input;
        const gear = car.currentGear > 0 ? car.config.gears[car.currentGear - 1] : null;
        
        const isClutchEngaged = !car.controls.clutch;

        // Переключение передач (только при выжатом сцеплении)
        if (car.controls.clutch) {
            if (input.isPressed('ShiftLeft') && car.currentGear < 6) {
                if (!car.lastGearUpPressed) {
                    car.currentGear++;
                    car.lastGearUpPressed = true;
                    if(window.AudioManager) window.AudioManager.playGearShift();
                }
            } else {
                car.lastGearUpPressed = false;
            }
            
            if (input.isPressed('ControlLeft') && car.currentGear > 0) {
                if (!car.lastGearDownPressed) {
                    car.currentGear--;
                    car.lastGearDownPressed = true;
                    if(window.AudioManager) window.AudioManager.playGearShift();
                }
            } else {
                car.lastGearDownPressed = false;
            }
        }

        // RPM Logic
        if (!isClutchEngaged || car.currentGear === 0) {
            if (car.controls.throttle > 0) {
                car.rpm = Math.min(car.rpm + 15000 * dt, 7500); 
            } else {
                car.rpm = Math.max(car.rpm - 8000 * dt, 800); 
            }
            
            // Проверка Clutch Kick
            if (car.lastClutchState && !car.controls.clutch && car.rpm > 4000) {
                car.clutchKickTimer = 0.5;
            }
        } else if (gear) {
            const speedRatio = Math.abs(car.speed) / (gear.maxSpeed * 5); 
            let targetRpm = 800 + speedRatio * 7000;
            car.rpm = window.GameMath.lerp(car.rpm, targetRpm, 10 * dt);
        }
        
        if (car.clutchKickTimer > 0) car.clutchKickTimer -= dt;
        car.rpm = Math.max(800, Math.min(car.rpm, 8000));
        car.lastClutchState = car.controls.clutch;
    }

    reset(car, x, y, angle) {
        car.pos = { x, y };
        car.angle = angle || 0;
        car.velocity = { x: 0, y: 0 };
        car.angularVelocity = 0;
        car.steeringAngle = 0;
        car.rpm = 800;
        car.currentGear = 0;
    }

    getDebugState(car) {
        return {
            speed: Math.round(car.speed),
            slipAngle: car.debugGrip ? Math.round(car.debugGrip.alphaR) : 0,
            gear: car.currentGear,
            rpm: Math.round(car.rpm)
        };
    }
}

// Экспорт (совместимость с текущей системой)
window.CarPhysicsInstance = new CarPhysics2D();
window.CarPhysics = {
    update: (car, dt) => window.CarPhysicsInstance.update(car, dt)
};
