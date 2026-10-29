import { describe, it, expect } from 'vitest';
import { BEAT_MS, LOGO_HIT_MS, introAudioUrl } from '../intro/constants';

describe('intro', () => {
  it('LOGO_HIT_MS y BEAT_MS son los del PROYECTO (§3.2, §5)', () => {
    expect(LOGO_HIT_MS).toBe(3200);
    expect(BEAT_MS).toBe(465);
  });

  it('arma la URL pública del audio en Supabase Storage (§5)', () => {
    const url = introAudioUrl();
    expect(url.startsWith('http')).toBe(true);
    expect(url).toContain('/storage/v1/object/public/intro/intro-tc-team.mp3');
  });
});
