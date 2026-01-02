/**
 * AudioManager - Управление звуками игры
 */

const AudioManager = {
    ctx: null,
    engineOsc: null,
    engineGain: null,
    tireOsc: null,
    tireGain: null,
    isInitialized: false,
    
    async init() {
        if (this.isInitialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Важно: Браузеры могут держать контекст в suspended до жеста пользователя
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }
            
            // Master Volume для общего контроля
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.5; // Общая громкость 50%
            this.masterGain.connect(this.ctx.destination);
            
            // 1. Настройка звука двигателя (упрощенный синтез)
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.value = 0;
            
            // Фильтр для более "глухого" звука двигателя
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            
            this.engineOsc.connect(filter);
            filter.connect(this.engineGain);
            this.engineGain.connect(this.masterGain); // Подключаем к Master
            this.engineOsc.start();
            
            // 2. Настройка звука визга шин
            this.tireOsc = this.ctx.createOscillator();
            this.tireOsc.type = 'square';
            this.tireGain = this.ctx.createGain();
            this.tireGain.gain.value = 0;
            
            const tireFilter = this.ctx.createBiquadFilter();
            tireFilter.type = 'highpass';
            tireFilter.frequency.value = 2000;
            
            this.tireOsc.connect(tireFilter);
            tireFilter.connect(this.tireGain);
            this.tireGain.connect(this.masterGain); // Подключаем к Master
            this.tireOsc.start();
            
            this.isInitialized = true;
            console.log('Audio initialized, state:', this.ctx.state);
        } catch (e) {
            console.error('Failed to init audio', e);
        }
    },
    
    update(car) {
        if (!this.isInitialized) return;
        
        // Обновление двигателя
        const baseFreq = 60; // Чуть выше бас
        const rpmFreq = (car.rpm / 1000) * 50;
        this.engineOsc.frequency.setTargetAtTime(baseFreq + rpmFreq, this.ctx.currentTime, 0.1);
        
        // Громкость двигателя зависит от газа + базовый гул
        // ХХ (800 rpm) -> тихий звук. Газ -> громкий.
        const idleVol = 0.1;
        const throttleVol = car.controls.throttle * 0.3;
        const targetVol = idleVol + throttleVol;
        
        this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.1);
        
        // Обновление визга шин
        if (car.isDrifting) {
            this.tireGain.gain.setTargetAtTime(0.05, this.ctx.currentTime, 0.1);
            this.tireOsc.frequency.setTargetAtTime(400 + (car.speed * 20), this.ctx.currentTime, 0.1);
        } else {
            this.tireGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
        }
    },
    
    playGearShift() {
        if (!this.isInitialized) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterGain); // Через мастер
        
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
};

window.AudioManager = AudioManager;
