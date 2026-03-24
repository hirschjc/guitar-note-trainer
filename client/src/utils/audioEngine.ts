import * as Tone from 'tone';

/**
 * Strips the enharmonic pair suffix from a note label.
 * e.g. "C#/Db" → "C#", "F#/Gb" → "F#", "C" → "C"
 */
function stripEnharmonic(noteName: string): string {
  const slashIdx = noteName.indexOf('/');
  return slashIdx !== -1 ? noteName.slice(0, slashIdx) : noteName;
}

/**
 * Guitar sounds one octave below written treble clef notation.
 * Subtract 1 from the written octave before passing to Tone.js.
 */
function concertOctave(writtenOctave: number): number {
  return writtenOctave - 1;
}

export class AudioEngine {
  private synth: Tone.Synth | null = null;
  private _muted = false;
  private _unavailable = false;
  private _initialized = false;

  /** Returns false if AudioContext creation failed. */
  isAvailable(): boolean {
    return !this._unavailable;
  }

  /** Returns current mute state. */
  isMuted(): boolean {
    return this._muted;
  }

  /** Mutes or unmutes all output. */
  setMuted(muted: boolean): void {
    this._muted = muted;
    if (this.synth) {
      this.synth.volume.value = muted ? -Infinity : 0;
    }
  }

  /**
   * Call this synchronously from a user gesture (click/tap) to unlock audio.
   * Safe to call multiple times.
   */
  resume(): void {
    if (this._initialized || this._unavailable) return;
    // Fire-and-forget — the important thing is it's called in the gesture handler
    void Tone.start().then(() => {
      if (this._initialized) return;
      try {
        this.synth = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: {
            attack: 0.01,
            decay: 0.3,
            sustain: 0.1,
            release: 0.5,
          },
        }).toDestination();
        if (this._muted) this.synth.volume.value = -Infinity;
        this._initialized = true;
      } catch {
        this._unavailable = true;
      }
    }).catch(() => {
      this._unavailable = true;
    });
  }

  /**
   * Lazily initializes Tone.js on first user interaction.
   */
  private async ensureInitialized(): Promise<boolean> {
    if (this._unavailable) return false;
    if (this._initialized) return true;

    try {
      await Tone.start();

      this.synth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.01,   // short attack — guitar-like pluck
          decay: 0.3,     // medium decay
          sustain: 0.1,   // low sustain
          release: 0.5,   // medium release
        },
      }).toDestination();

      if (this._muted) {
        this.synth.volume.value = -Infinity;
      }

      this._initialized = true;
      return true;
    } catch {
      this._unavailable = true;
      return false;
    }
  }

  /**
   * Plays the note immediately at normal volume. Duration ~0.5s.
   * @param noteName  e.g. "C", "F#", "Bb", "C#/Db"
   * @param octave    written treble-clef octave (will be transposed down 1)
   */
  async playNote(noteName: string, octave: number): Promise<void> {
    if (this._muted) return;
    const ready = await this.ensureInitialized();
    if (!ready || !this.synth) return;

    try {
      const pitch = `${stripEnharmonic(noteName)}${concertOctave(octave)}`;
      this.synth.triggerAttackRelease(pitch, '8n');
    } catch {
      // Degrade silently
    }
  }

  /**
   * Plays the note softer (lower volume) with a ~300ms delay.
   * @param noteName  e.g. "C", "F#", "Bb", "C#/Db"
   * @param octave    written treble-clef octave (will be transposed down 1)
   */
  async playHint(noteName: string, octave: number): Promise<void> {
    if (this._muted) return;
    const ready = await this.ensureInitialized();
    if (!ready || !this.synth) return;

    try {
      const pitch = `${stripEnharmonic(noteName)}${concertOctave(octave)}`;
      const hintTime = Tone.now() + 0.3;
      // Temporarily lower volume for the hint note
      const originalVolume = this.synth.volume.value;
      this.synth.volume.value = originalVolume - 12; // ~12dB softer
      this.synth.triggerAttackRelease(pitch, '8n', hintTime);
      // Restore volume after the hint plays
      setTimeout(() => {
        if (this.synth && !this._muted) {
          this.synth.volume.value = originalVolume;
        }
      }, 600);
    } catch {
      // Degrade silently
    }
  }
}

export const audioEngine = new AudioEngine();
