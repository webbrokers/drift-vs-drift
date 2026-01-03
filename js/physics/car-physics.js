/**
 * Модуль физики автомобиля
 */

const CarPhysics = {
    update(car, dt) {
        const input = window.Input;
        const math = window.GameMath;
        
        // 1. Считывание управления (WASD + Стрелки)
        // Газ: W или Стрелка Вверх
        car.controls.throttle = (input.isPressed('ArrowUp') || input.isPressed('KeyW')) ? 1 : 0;
        // Тормоз: S или Стрелка Вниз
        car.controls.brake = (input.isPressed('ArrowDown') || input.isPressed('KeyS')) ? 1 : 0;
        // Ручник: Пробел
        car.controls.handbrake = input.isPressed('Space');
        // Сцепление: Z или Alt
        car.controls.clutch = input.isPressed('AltLeft') || input.isPressed('KeyZ');
        
        // 2. Рулевое управление (A/D или Стрелки)
        let targetSteering = 0;
        if (input.isPressed('ArrowLeft') || input.isPressed('KeyA')) targetSteering = -car.config.maxSteeringAngle;
        if (input.isPressed('ArrowRight') || input.isPressed('KeyD')) targetSteering = car.config.maxSteeringAngle;
        
        // Плавный поворот руля
        const steerDiff = targetSteering - car.steeringAngle;
        // Возврат в центр в 2 раза медленнее поворота
        const currentSteeringSpeed = (targetSteering === 0) ? car.config.steeringSpeed / 2 : car.config.steeringSpeed;
        car.steeringAngle += Math.sign(steerDiff) * Math.min(Math.abs(steerDiff), currentSteeringSpeed * dt);
        
        // 3. Расчет сил и скоростей
        const forward = { x: Math.sin(car.angle), y: -Math.cos(car.angle) };
        const right = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
        
        // Матрица вращения для локальных скоростей
        const vForward = car.velocity.x * forward.x + car.velocity.y * forward.y;
        const vRight = car.velocity.x * right.x + car.velocity.y * right.y;
        
        car.speed = vForward;
        
        // Силы тяги и торможения
        // Если сцепление выжато ИЛИ нейтраль (gear 0) -> нет тяги
        const isClutchEngaged = !car.controls.clutch && car.currentGear !== 0;
        
        // Масштабирование сил для корректного движения (масса 1200)
        // Снижаем FORCE_SCALE с 500 до 50 для реализма
        const FORCE_SCALE = 50;
        
        let engineForce = 0;
        if (isClutchEngaged) {
             engineForce = car.controls.throttle * 800 * FORCE_SCALE * (car.config.gears[car.currentGear - 1].ratio / 3.5);
        }
        
        const brakeForce = (car.controls.brake * 1200 + (car.controls.handbrake ? 2000 : 0)) * FORCE_SCALE;
        
        // Продольная сила (тяга - тормоз - сопротивление)
        // Сопротивление воздуха и качения
        const dragForce = vForward * 10; 
        
        // Исправляем баг торможения на месте
        let finalBrakeForce = brakeForce;
        if (Math.abs(vForward) < 1 && car.controls.brake > 0 && car.controls.throttle === 0) {
            // Если почти стоим и жмем тормоз - просто обнуляем скорость и не даем сил
            car.velocity.x *= 0.8;
            car.velocity.y *= 0.8;
            finalBrakeForce = 0;
        }

        const totalLongForce = engineForce - (Math.sign(vForward) * finalBrakeForce) - dragForce;
        
        // Боковая сила (упрощенная модель сцепления)
        // Чем больше боковая скорость, тем сильнее шины сопротивляются, пока не сорвутся в занос
        // Улучшенная модель сцепления
        // По умолчанию 15.0 (для лучшего держака), при ручнике 0.2
        let currentGrip = car.controls.handbrake ? 0.2 : 15.0;
        
        // Если выжато сцепление и НЕ нажат ручник - задние колеса "свободны" и имеют лучшее сцепление
        // Это позволяет машине ехать туда, куда повернуты колеса при выжатом сцеплении
        if (car.controls.clutch && !car.controls.handbrake) {
            currentGrip = 6.0; // Усиленный зацеп для выравнивания
        }

        // Инициация заноса: Сцепление + Ручник + Повернутый руль на скорости
        if (car.controls.clutch && car.controls.handbrake && Math.abs(car.steeringAngle) > 0.1 && Math.abs(car.speed) > 5) {
            currentGrip = 0.1; // Резкий срыв
        }
        
        // Clutch Kick Effect
        if (car.clutchKickTimer && car.clutchKickTimer > 0) {
            currentGrip = 0.5; 
        }
        
        const lateralGrip = currentGrip; 
        const lateralForce = -vRight * lateralGrip * car.config.mass;
        
        // 4. Поворот (Кинематическая модель + Инерция)
        // Машина должна ехать туда, куда повернуты колеса.
        // wheelbase - расстояние между осями (примерно 70% высоты машины)
        const wheelbase = car.config.height * 0.7;
        
        // Целевая угловая скорость на основе Ackermann steering
        // w = (v / R) where R = wheelbase / sin(steeringAngle)
        let targetAngularVelocity = 0;
        if (Math.abs(car.speed) > 1) {
            targetAngularVelocity = (car.speed / wheelbase) * Math.tan(car.steeringAngle);
        }

        // Плавное достижение целевой угловой скорости (инерция)
        const turningResponsiveness = 5.0; // Как быстро машина следует за рулем
        const angularAcceleration = (targetAngularVelocity - car.angularVelocity) * turningResponsiveness;
        
        car.angularVelocity += angularAcceleration * dt;
        
        // Демпфирование (сопротивление вращению)
        const angularDrag = 0.9; 
        car.angularVelocity *= Math.pow(angularDrag, dt * 60);

        car.angle += car.angularVelocity * dt;
        
        // 5. Суммируем ускорения
        const accelX = (forward.x * totalLongForce + right.x * lateralForce) / car.config.mass;
        const accelY = (forward.y * totalLongForce + right.y * lateralForce) / car.config.mass;
        
        car.velocity.x += accelX * dt;
        car.velocity.y += accelY * dt;
        
        // Предотвращаем бесконечно малые скорости
        if (Math.abs(car.velocity.x) < 0.1) car.velocity.x = 0;
        if (Math.abs(car.velocity.y) < 0.1) car.velocity.y = 0;
        
        // 6. Обновление позиции
        const nextX = car.pos.x + car.velocity.x * dt;
        const nextY = car.pos.y + car.velocity.y * dt;
        
        // Коллизия с трассой ОТКЛЮЧЕНА (Открытый мир)
        /*
        if (window.track && !window.track.isPointOnTrack(nextX, nextY)) {
            car.velocity.x *= 0.95; 
            car.velocity.y *= 0.95;
        }
        */
        
        car.pos.x = nextX;
        car.pos.y = nextY;
        
        // 7. Обновление RPM
        this.updateEngine(car, dt);
        
        // 8. Обновление системы дрифта
        const drift = window.DriftSystem.update(car, dt);
        
        // 9. Влияние дрифта на физику (сопротивление при заносе)
        if (drift.isDrifting) {
            const speedLossFactor = 1 - (drift.slipAngle / 90) * 0.3;
            car.velocity.x *= (1 - dt * 0.2 * (drift.slipAngle / 45)); 
            car.velocity.y *= (1 - dt * 0.2 * (drift.slipAngle / 45));
        }
    },
    
    updateEngine(car, dt) {
        const input = window.Input;
        const gear = car.currentGear > 0 ? car.config.gears[car.currentGear - 1] : null;
        
        const throttle = car.controls.throttle;
        const isClutchEngaged = !car.controls.clutch;

        // Инициализация таймера Clutch Kick, если его нет
        if (typeof car.clutchKickTimer === 'undefined') {
            car.clutchKickTimer = 0;
        }
        
        // Уменьшаем таймер действия пинка
        if (car.clutchKickTimer > 0) {
            car.clutchKickTimer -= dt;
        }

        // 1. Управление передачами 
        if (car.controls.clutch) {
            if (input.isPressed('ShiftLeft') && car.currentGear < 6) {
                if (!this.lastGearUpPressed) {
                    car.currentGear++;
                    this.lastGearUpPressed = true;
                    window.AudioManager.playGearShift();
                }
            } else {
                this.lastGearUpPressed = false;
            }
            
            if (input.isPressed('ControlLeft') && car.currentGear > 0) {
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
        if (!isClutchEngaged || car.currentGear === 0) {
            if (throttle > 0) {
                car.rpm = Math.min(car.rpm + 15000 * dt, 7500); 
            } else {
                // Падение оборотов в 2 раза медленнее роста (15000 / 2 = 7500)
                car.rpm = Math.max(car.rpm - 7500 * dt, 800); 
            }
            car.lastRpmBeforeClutchRelease = car.rpm;
        } 
        else if (gear) {
            // При включенной передаче и отпущенном сцеплении обороты связаны со скоростью колес
            const speedRatio = Math.abs(car.speed) / (gear.maxSpeed * 3); 
            let targetRpm = 800 + speedRatio * 7000;
            
            // Если мы тормозим на передаче, обороты не должны падать мгновенно
            car.rpm = window.GameMath.lerp(car.rpm, targetRpm, 10 * dt);
        }
        
        // Жесткое ограничение RPM
        car.rpm = Math.max(800, Math.min(car.rpm, 8000));
        
        car.lastClutchState = car.controls.clutch;
    }
};

window.CarPhysics = CarPhysics;
