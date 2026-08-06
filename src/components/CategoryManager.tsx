import { useState } from 'react';
import { categoryLabel, wordLabel } from '../i18n';
import { applyCategoryPrefs, reorder } from '../services/categories';
import type { Category, CustomCategory, CustomTile, Language, Settings } from '../types';

interface CategoryManagerProps {
  /** Every category the child could see, before order/hide preferences */
  categories: Category[];
  customCategories: CustomCategory[];
  customTiles: CustomTile[];
  settings: Settings;
  language: Language;
  onUpdate: (patch: Partial<Settings>) => void;
  onAddCategory: (name: string, emoji: string) => void;
  onRemoveCategory: (id: string) => void;
  /** Opens the tile editor, starting in this category when given */
  onAddTile: (categoryId?: string) => void;
  onEditTile: (tile: CustomTile) => void;
}

const AGE_LABEL: Record<number, string> = {
  1: '🐣 Little',
  2: '🐥 Junior',
  3: '🦅 Senior',
};

/**
 * One screen for every category on the board: order, visibility, and the
 * parent's own categories. Hiding is per child and reversible — nothing is
 * deleted, so a category switched off for a 4-year-old is still there when
 * they are 7.
 */
export function CategoryManager({
  categories,
  customCategories,
  customTiles,
  settings,
  language,
  onUpdate,
  onAddCategory,
  onRemoveCategory,
  onAddTile,
  onEditTile,
}: CategoryManagerProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [message, setMessage] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const hidden = settings.hiddenCategoryIds ?? [];

  /**
   * A parent's own category only reaches the child's board once it holds a
   * tile, so an empty one is missing from `categories` — exactly the category
   * they need to open in order to put the first tile in it.
   */
  const withEmptyOwn: Category[] = [
    ...categories,
    ...customCategories
      .filter((cc) => !categories.some((c) => c.id === cc.id))
      .map((cc) => ({
        id: cc.id,
        emoji: cc.emoji,
        en: cc.name,
        hi: cc.name,
        color: cc.color,
        colorDark: cc.colorDark,
        level: 1 as const,
        group: 'talk' as const,
        words: [],
      })),
  ];

  // Show every category here, including hidden ones, in the order the child
  // would see them — the manager is the one place hidden ones must appear.
  const ordered = applyCategoryPrefs(withEmptyOwn, settings.categoryOrder ?? [], []);
  const orderIds = ordered.map((c) => c.id);
  const visibleCount = ordered.filter((c) => !hidden.includes(c.id)).length;
  const isCustom = (id: string) => customCategories.some((c) => c.id === id);
  /** Categories a parent-made tile can actually live in */
  const isOwnCategory = (id: string) => isCustom(id) || id === 'my-words';
  const tileById = new Map(customTiles.map((t) => [t.id, t]));

  const toggle = (id: string) => {
    const isHidden = hidden.includes(id);
    if (!isHidden && visibleCount <= 1) {
      setMessage('At least one category has to stay on the board.');
      return;
    }
    setMessage('');
    onUpdate({
      hiddenCategoryIds: isHidden ? hidden.filter((h) => h !== id) : [...hidden, id],
    });
  };

  const move = (id: string, delta: number) =>
    onUpdate({ categoryOrder: reorder(orderIds, id, delta) });

  return (
    <div className="cats">
      <header className="dash-head">
        <div>
          <h3 className="dash-title">📁 Categories</h3>
          <p className="ft-hint">
            Choose what appears on this child's board and the order it appears
            in. Fewer categories can mean a calmer board for a younger child;
            hiding one never deletes anything.
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            onUpdate({ categoryOrder: [], hiddenCategoryIds: [] });
            setMessage('Back to the default order, everything showing.');
          }}
        >
          ↩️ Reset
        </button>
      </header>

      <p className="progress-line">
        {visibleCount} of {ordered.length} showing
      </p>

      <div className="cat-list">
        {ordered.map((cat, i) => {
          const off = hidden.includes(cat.id);
          const words = cat.words.filter((w) => w.level <= settings.ageMode).length;
          return (
            <div key={cat.id} className={`cat-row ${off ? 'cat-row-off' : ''}`}>
              <span
                className="cat-swatch"
                style={{ background: cat.color, color: cat.colorDark }}
                aria-hidden="true"
              >
                {cat.emoji}
              </span>
              <span className="cat-name">
                {categoryLabel(cat, language)}
                <small className="account-meta">
                  {words} words shown · {AGE_LABEL[cat.level] ?? ''}
                  {isCustom(cat.id) ? ' · yours' : ''}
                </small>
              </span>

              <div className="cat-actions">
                <button
                  className="btn-secondary btn-small"
                  aria-expanded={openId === cat.id}
                  onClick={() => setOpenId(openId === cat.id ? null : cat.id)}
                >
                  {openId === cat.id ? '▲ Close' : '👀 View'}
                </button>
                <button
                  className="btn-secondary btn-small"
                  aria-label={`Move ${cat.en} up`}
                  disabled={i === 0}
                  onClick={() => move(cat.id, -1)}
                >
                  ↑
                </button>
                <button
                  className="btn-secondary btn-small"
                  aria-label={`Move ${cat.en} down`}
                  disabled={i === ordered.length - 1}
                  onClick={() => move(cat.id, 1)}
                >
                  ↓
                </button>
                <button
                  className={`btn-secondary btn-small ${off ? '' : 'cat-on'}`}
                  aria-pressed={!off}
                  onClick={() => toggle(cat.id)}
                >
                  {off ? '🚫 Off' : '👁️ On'}
                </button>
                {isCustom(cat.id) && (
                  <button
                    className="btn-delete"
                    aria-label={`Delete category ${cat.en}`}
                    onClick={() => onRemoveCategory(cat.id)}
                  >
                    🗑️
                  </button>
                )}
              </div>

              {openId === cat.id && (
                <div className="cat-tiles">
                  {cat.words.length === 0 ? (
                    <p className="ft-hint">Nothing in here yet.</p>
                  ) : (
                    <div className="cat-tile-grid">
                      {cat.words.map((w) => {
                        const own = tileById.get(w.id);
                        return own ? (
                          <button
                            key={w.id}
                            className="cat-tile cat-tile-own"
                            onClick={() => onEditTile(own)}
                            title="Edit this tile"
                          >
                            {w.image ? (
                              <img className="cat-tile-img" src={w.image} alt="" />
                            ) : (
                              <span className="cat-tile-emoji">{w.emoji}</span>
                            )}
                            <span className="cat-tile-name">{wordLabel(w, language)}</span>
                            <span className="cat-tile-edit">✏️</span>
                          </button>
                        ) : (
                          <span key={w.id} className="cat-tile">
                            {w.image ? (
                              <img className="cat-tile-img" src={w.image} alt="" />
                            ) : (
                              <span className="cat-tile-emoji">{w.emoji}</span>
                            )}
                            <span className="cat-tile-name">{wordLabel(w, language)}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
                    <button
                      className="btn-primary"
                      onClick={() => onAddTile(isOwnCategory(cat.id) ? cat.id : undefined)}
                    >
                      ➕ Add a tile{isOwnCategory(cat.id) ? ` to ${cat.en}` : ''}
                    </button>
                  </div>
                  {!isOwnCategory(cat.id) && (
                    <p className="ft-hint">
                      The built-in words here can't be changed — they are shared
                      by every child. A tile you add goes to ⭐ My Words, or pick
                      one of your own categories in the editor.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {message && <p className="progress-line">{message}</p>}

      <h4 className="account-sub">➕ Your own category</h4>
      <p className="ft-hint">
        For tiles you make yourself — "School", "Grandma's house", "Therapy".
      </p>
      <div className="add-row">
        <input
          className="text-field add-row-field"
          type="text"
          maxLength={20}
          placeholder="Category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="text-field cat-emoji-field"
          type="text"
          maxLength={2}
          placeholder="🎒"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
        />
        <button
          className="btn-secondary"
          onClick={() => {
            if (!name.trim()) {
              setMessage('Give the category a name.');
              return;
            }
            onAddCategory(name, emoji || '📁');
            setName('');
            setEmoji('');
            setMessage(`Added ${name.trim()}.`);
          }}
        >
          ➕ Add
        </button>
      </div>
    </div>
  );
}
