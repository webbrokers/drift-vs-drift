/**
 * Модуль физики автомобиля
 */

const CarPhysics = {
    update(car, dt) {
        const input = window.Input;
        const math = window.GameMath;
        
        // 1. Считывание управления
        car.controls.throttle = input.isPressed('ArrowUp') ? 1 : 0;
        car.controls.brake = input.isPressed('ArrowDown') ? 1 : 0;
        car.controls.handbrake = input.isPressed('Space');
        car.controls.clutch = input.isPressed('AltLeft');
        
        // 2. Рулевое управление
        let targetSteering = 0;
        if (input.isPressed('ArrowLeft')) targetSteering = -car.config.maxSteeringAngle;
        if (input.isPressed('ArrowRight')) targetSteering = car.config.maxSteeringAngle;
        
        // Плавный поворот руля
        const steerDiff = targetSteering - car.steeringAngle;
        car.steeringAngle += Math.sign(steerDiff) * Math.min(Math.abs(steerDiff), car.config.steeringSpeed * dt);
        
        // 3. Расчет сил и скоростей
        const forward = { x: Math.sin(car.angle), y: -Math.cos(car.angle) };
        const right = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
        
        // Матрица вращения для локальных скоростей
        const vForward = car.velocity.x * forward.x + car.velocity.y * forward.y;
        const vRight = car.velocity.x * right.x + car.velocity.y * right.y;
        
        car.speed = vForward;
        
        // Силы тяги и торможения
        const engineForce = car.controls.clutch ? 0 : (car.controls.throttle * 800 * (car.config.gears[car.currentGear - 1].ratio / 3.5));
        const brakeForce = car.controls.brake * 1200 + (car.controls.handbrake ? 2000 : 0);
        
        // Продольная сила (тяга - тормоз - сопротивление)
        const totalLongForce = engineForce - (Math.sign(vForward) * brakeForce) - (vForward * 0.5);
        
        // Боковая сила (упрощенная модель сцепления)
        // Чем больше боковая скорость, тем сильнее шины сопротивляются, пока не сорвутся в занос
        const lateralGrip = car.controls.handbrake ? 0.2 : 0.9;
        const lateralForce = -vRight * lateralGrip * car.config.mass;
        
        // 4. Поворот (центробежные силы и влияние руля)
        const rotationScale = car.speed * 0.005;
        const torque = car.steeringAngle * rotationScale * car.config.mass;
        const angularAcceleration = torque / 1500; // момент инерции из конфига
        
        car.angularVelocity = angularAcceleration; // упрощенно приравняем пока
        car.angle += car.angularVelocity * dt;
        
        // 5. Суммируем ускорения
        const accelX = (forward.x * totalLongForce + right.x * lateralForce) / car.config.mass;
        const accelY = (forward.y * totalLongForce + right.y * lateralForce) / car.config.mass;
        
        car.velocity.x += accelX * dt;
        car.velocity.y += accelY * dt;
        
        // Предотвращаем бесконечно малые скорости
        if (Math.abs(car.velocity.x) < 0.01) car.velocity.x = 0;
        if (Math.abs(car.velocity.y) < 0.01) car.velocity.y = 0;
        
        // 6. Обновление позиции
        const nextX = car.pos.x + car.velocity.x * dt;
        const nextY = car.pos.y + car.velocity.y * dt;
        
        // Коллизия с трассой (замедление на траве)
        if (window.track && !window.track.isPointOnTrack(nextX, nextY)) {
            car.velocity.x *= 0.95; // Сильное трение травы
            car.velocity.y *= 0.95;
        }
        
        car.pos.x = nextX;
        car.pos.y = nextY;
        
        // 7. Обновление RPM
        this.updateEngine(car, dt);
        
        // 8. Обновление системы дрифта
        const drift = window.DriftSystem.update(car, dt);
        
        // 9. Влияние дрифта на физику (сопротивление при заносе)
        if (drift.isDrifting) {
            const speedLossFactor = 1 - (drift.slipAngle / 90) * 0.3;
            car.velocity.x *= (1 - dt * 0.2 * (drift.slipAngle / 45)); // Постепенное замедление вместо резкого множителя
            car.velocity.y *= (1 - dt * 0.2 * (drift.slipAngle / 45));
        }
    },
    
    updateEngine(car, dt) {
        const input = window.Input;
        const gear = car.config.gears[car.currentGear - 1];
        
        // 1. Управление передачами (Ctrl/Shift)
        if (car.controls.clutch) {
            if (input.isPressed('ControlLeft') && car.currentGear < 6) {
                // Передача вверх (защита от дребезга нажатий - нужна была бы здесь, 
                // но пока упростим до простого переключения)
                if (!this.lastGearUpPressed) {
                    car.currentGear++;
                    this.lastGearUpPressed = true;
                    window.AudioManager.playGearShift();
                }
            } else {
                this.lastGearUpPressed = false;
            }
            
            if (input.isPressed('ShiftLeft') && car.currentGear > 1) {
                if (!this.lastGearDownPressed) {
                    car.currentGear--;
                    this.lastGearDownPressed = true;
                    window.AudioManager.playGearShift();
                }
            } else {
                this.lastGearDownPressed = false;
            }
        }

        // 2. Расчет оборотов (RPM)
        if (car.controls.clutch) {
            // Сцепление выжато: обороты растут от газа или падают на холостые
            if (car.controls.throttle > 0) {
                car.rpm = Math.min(car.rpm + 8000 * dt, 7500);
            } else {
                car.rpm = Math.max(car.rpm - 3000 * dt, 1000);
            }
            car.lastRpmBeforeClutchRelease = car.rpm;
        } else {
            // Сцепление отпущено: обороты связаны со скоростью
            const targetRpm = 1000 + (Math.abs(car.speed) / gear.maxSpeed) * 6000;
            
            // Если мы только что отпустили сцепление (Clutch Kick)
            if (car.lastClutchState === true) {
                const rpmDiff = car.lastRpmBeforeClutchRelease - targetRpm;
                if (rpmDiff > 1000) {
                    // Штраф: рывок и потеря скорости
                    car.speed *= 0.95;
                    console.log('Clutch Kick Penalty!');
                } else if (rpmDiff > 100) {
                    // Бонус: пинок ускорения
                    car.speed += 2; 
                    console.log('Clutch Kick Boost!');
                }
            }
            
            // Обороты стремятся к целевым (связанным со скоростью)
            car.rpm = window.GameMath.lerp(car.rpm, targetRpm, 0.2);
            
            // Если обороты слишком низкие для этой передачи - машина дергается (будет позже)
        }
        
        car.lastClutchState = car.controls.clutch;
    }
};

window.CarPhysics = CarPhysics;
