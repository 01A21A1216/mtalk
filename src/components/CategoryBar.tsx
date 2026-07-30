import { categoryLabel } from '../i18n';
import type { AgeMode, Category, Language } from '../types';

interface CategoryBarProps {
  categories: Category[];
  activeId: string;
  language: Language;
  ageMode: AgeMode;
  onSelect: (id: string) => void;
}

export function CategoryBar({ categories, activeId, language, ageMode, onSelect }: CategoryBarProps) {
  const visible = categories.filter((c) => c.level <= ageMode);

  return (
    <nav className="category-bar" aria-label="Categories">
      {visible.map((cat) => {
        const active = cat.id === activeId;
        return (
          <button
            key={cat.id}
            className={`category-chip ${active ? 'category-chip-active' : ''}`}
            style={{
              background: active ? cat.colorDark : cat.color,
              color: active ? '#fff' : cat.colorDark,
            }}
            onClick={() => onSelect(cat.id)}
          >
            <span className="category-emoji" aria-hidden="true">
              {cat.emoji}
            </span>
            <span>{categoryLabel(cat, language)}</span>
          </button>
        );
      })}
    </nav>
  );
}
