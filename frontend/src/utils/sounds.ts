export const playOrderSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playBeep = (frequency: number, duration: number, startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playBeep(880, 0.15, now);
    playBeep(1100, 0.15, now + 0.2);
    playBeep(1320, 0.2, now + 0.4);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export const playReadySound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, duration: number, startTime: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    playTone(523, 0.2, now);
    playTone(659, 0.2, now + 0.25);
    playTone(784, 0.3, now + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
};
