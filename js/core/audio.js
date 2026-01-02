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
    
    init() {
        if (this.isInitialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            
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
            this.engineGain.connect(this.ctx.destination);
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
            this.tireGain.connect(this.ctx.destination);
            this.tireOsc.start();
            
            this.isInitialized = true;
            console.log('Audio initialized');
        } catch (e) {
            console.error('Failed to init audio', e);
        }
    },
    
    update(car) {
        if (!this.isInitialized) return;
        
        // Обновление двигателя
        const baseFreq = 50;
        const rpmFreq = (car.rpm / 1000) * 40;
        this.engineOsc.frequency.setTargetAtTime(baseFreq + rpmFreq, this.ctx.currentTime, 0.1);
        
        // Громкость двигателя зависит от газа
        const targetVol = 0.1 + (car.controls.throttle * 0.15);
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
        gain.connect(this.ctx.destination);
        
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }
};

window.AudioManager = AudioManager;
