/**
 * HUD - Управление отображением игровых параметров
 */

const HUD = {
    elements: {
        score: null,
        speed: null,
        rpm: null,
        rpmBar: null,
        gear: null,
        steering: null,
        handbrake: null,
        clutch: null
    },
    
    init() {
        this.elements.score = document.getElementById('score');
        this.elements.speed = document.getElementById('speed');
        this.elements.rpm = document.getElementById('rpm');
        this.elements.rpmBar = document.getElementById('rpm-bar');
        this.elements.gear = document.getElementById('gear');
        this.elements.steering = document.getElementById('steering-indicator');
        this.elements.handbrake = document.getElementById('handbrake-icon');
        this.elements.clutch = document.getElementById('clutch-icon');
    },
    
    update(car) {
        if (!this.elements.score) this.init();
        
        // Очки
        const currentPoints = Math.round(car.driftPointsAccumulator);
        if (car.isDrifting) {
            this.elements.score.textContent = car.totalScore + " + " + currentPoints;
            this.elements.score.style.color = '#ffaa00';
        } else {
            this.elements.score.textContent = car.totalScore;
            this.elements.score.style.color = 'white';
        }
        
        // Скорость в км/ч
        const speedKmH = Math.round(Math.abs(car.speed) * 3.6);
        this.elements.speed.textContent = speedKmH;
        
        // RPM и полоска
        this.elements.rpm.textContent = Math.round(car.rpm);
        const rpmPercent = Math.min((car.rpm / 8000) * 100, 100);
        this.elements.rpmBar.style.width = rpmPercent + '%';
        
        // Передача
        let gearText = car.currentGear;
        if (car.currentGear === 0) gearText = 'N';
        else if (car.currentGear === 7) gearText = 'R';
        this.elements.gear.textContent = gearText;
        
        // Индикатор руля (переводим угол в % заполнения)
        const steerPercent = (car.steeringAngle / car.config.maxSteeringAngle) * 50;
        this.elements.steering.style.width = Math.abs(steerPercent) + '%';
        this.elements.steering.style.left = (50 + (steerPercent < 0 ? steerPercent : 0)) + '%';
        
        // Цвет индикатора руля
        const steerAbs = Math.abs(car.steeringAngle);
        if (steerAbs > car.config.maxSteeringAngle * 0.8) {
            this.elements.steering.style.background = '#ff0000';
        } else if (steerAbs > car.config.maxSteeringAngle * 0.4) {
            this.elements.steering.style.background = '#ffff00';
        } else {
            this.elements.steering.style.background = '#00ff00';
        }
        
        // Индикаторы
        if (car.controls.handbrake) {
            this.elements.handbrake.classList.add('active');
        } else {
            this.elements.handbrake.classList.remove('active');
        }
        
        if (car.controls.clutch) {
            this.elements.clutch.classList.add('active');
        } else {
            this.elements.clutch.classList.remove('active');
        }
    }
};

window.HUD = HUD;
