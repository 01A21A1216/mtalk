import { useState } from 'react';
import { playPop } from '../services/speech';
import type { Profile } from '../types';

interface ProfilePickerProps {
  profiles: Profile[];
  onPick: (id: string) => void;
}

/** Netflix-style "who is playing?" screen shown at start and when switching */
export function ProfilePicker({ profiles, onPick }: ProfilePickerProps) {
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <div className="profile-screen">
      <div className="brand profile-brand">
        <span className="brand-logo" aria-hidden="true">🗣️</span>
        <span className="brand-name">MTalk</span>
      </div>
      <h1 className="profile-question">Who is talking today?</h1>
      <div className="profile-grid">
        {profiles.map((p) => (
          <button
            key={p.id}
            className={`profile-card ${pressed === p.id ? 'profile-card-pressed' : ''}`}
            onClick={() => {
              playPop();
              setPressed(p.id);
              window.setTimeout(() => onPick(p.id), 250);
            }}
          >
            <span className="profile-avatar" aria-hidden="true">{p.emoji}</span>
            <span className="profile-name">{p.name}</span>
          </button>
        ))}
      </div>
      <p className="profile-hint">Grown-ups: add or remove kids in ⚙️ Settings</p>
    </div>
  );
}
