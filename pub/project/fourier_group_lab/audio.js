(function (root) {
  'use strict';
  class LabSynth {
    constructor() { this.ctx=null; this.voices=new Map(); this.volume=.15; }
    async start(id, samples, frequency, duration=0) {
      if(this.voices.has(id)) return;
      if(this.voices.size>=8) throw new Error('同時に鳴らせる音は8音までです。');
      if(!Number.isFinite(frequency)||frequency<10||frequency>12000) throw new Error('この音は再生範囲（10〜12000Hz）の外です。');
      const state={}; this.voices.set(id,state);
      try {
        const AudioCtx=root.AudioContext||root.webkitAudioContext;
        if(!AudioCtx) throw new Error('このブラウザーはWeb Audioに対応していません。WAV保存をお試しください。');
        if(!this.ctx) this.ctx=new AudioCtx();
        await this.ctx.resume();
        if(this.voices.get(id)!==state) return;
        const h=Fourier.harmonics(samples,frequency,this.ctx.sampleRate);
        const oscillator=this.ctx.createOscillator(), gain=this.ctx.createGain();
        oscillator.setPeriodicWave(this.ctx.createPeriodicWave(h.real,h.imag,{disableNormalization:true}));
        oscillator.frequency.value=frequency;
        gain.gain.setValueAtTime(0,this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.volume*h.gain/4,this.ctx.currentTime+.015);
        oscillator.connect(gain);gain.connect(this.ctx.destination);
        Object.assign(state,{oscillator,gain,normalization:h.gain});
        oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
        oscillator.start();
        if(duration) state.timer=setTimeout(()=>this.stop(id),duration*1000);
      } catch(error) { if(this.voices.get(id)===state) this.voices.delete(id); throw error; }
    }
    stop(id) {
      const v=this.voices.get(id); if(!v)return;
      this.voices.delete(id);clearTimeout(v.timer);
      if(v.oscillator) {
        const now=this.ctx.currentTime;
        v.gain.gain.cancelScheduledValues(now);v.gain.gain.setTargetAtTime(0,now,.012);
        v.oscillator.stop(now+.08);
      }
    }
    stopAll() { for(const key of this.voices.keys())this.stop(key); }
    setVolume(volume) {
      this.volume=volume;
      if(this.ctx)for(const v of this.voices.values())if(v.gain)v.gain.gain.setTargetAtTime(volume*v.normalization/4,this.ctx.currentTime,.015);
    }
  }
  root.LabSynth=LabSynth;
})(globalThis);
