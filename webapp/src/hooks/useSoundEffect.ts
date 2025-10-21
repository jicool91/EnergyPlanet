/**
 * Hook for playing sound effects
 * Currently a placeholder - can be extended with audio library (Howler.js, etc.)
 */

type SoundEffectType = 'unlock' | 'purchase' | 'upgrade' | 'levelup' | 'tap' | 'success' | 'error';

/**
 * useSoundEffect: Play sound effects
 *
 * Usage:
 * const playSound = useSoundEffect();
 * playSound('unlock');
 *
 * Future: Can add Web Audio API or Howler.js for actual sounds
 */
export const useSoundEffect = () => {
  const playSoundEffect = (soundType: SoundEffectType) => {
    // Placeholder implementation
    // In production, would use Web Audio API or a library like Howler.js

    // For now, use Web Audio API to create a simple beep
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const soundConfigs: Record<SoundEffectType, { freq: number; duration: number; volume: number }> = {
        unlock: { freq: 800, duration: 0.3, volume: 0.3 },      // Medium-high beep
        purchase: { freq: 600, duration: 0.2, volume: 0.2 },    // Lower beep
        upgrade: { freq: 700, duration: 0.25, volume: 0.25 },   // Medium beep
        levelup: { freq: 1000, duration: 0.4, volume: 0.3 },    // High beep
        tap: { freq: 500, duration: 0.1, volume: 0.15 },        // Low short beep
        success: { freq: 900, duration: 0.3, volume: 0.25 },    // Success tone
        error: { freq: 300, duration: 0.2, volume: 0.2 },       // Error tone
      };

      const config = soundConfigs[soundType];

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = config.freq;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(config.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + config.duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + config.duration);
    } catch (err) {
      // Silently fail if AudioContext not available
      console.debug('Sound effect unavailable:', soundType);
    }
  };

  return playSoundEffect;
};
