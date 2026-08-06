import type { Category, Word } from '../types';

/**
 * Content packs — the words a child needs on the days that are not ordinary.
 *
 * A festival, a doctor's appointment or the first week of school is exactly
 * when a non-verbal child has most to say and fewest words for it. These are
 * kept out of the core board so a five-year-old is not wading through Eid
 * vocabulary in June, and switched on per child when the day comes.
 *
 * English and Hindi are written here; Telugu, Tamil and Kannada come from the
 * translation files, and anything missing falls back to English rather than
 * showing a blank.
 */

const w = (id: string, emoji: string, en: string, hi: string): Word => ({
  id,
  emoji,
  en,
  hi,
  level: 1,
});

export const PACKS: Category[] = [
  {
    id: 'pack-diwali',
    emoji: '🪔',
    en: 'Diwali',
    hi: 'दिवाली',
    color: '#FFF3E0',
    colorDark: '#E65100',
    level: 1,
    group: 'talk',
    words: [
      w('pk-diya', '🪔', 'Diya', 'दीया'),
      w('pk-rangoli', '🎨', 'Rangoli', 'रंगोली'),
      w('pk-lights', '✨', 'Lights', 'रोशनी'),
      w('pk-sweets', '🍬', 'Sweets', 'मिठाई'),
      w('pk-newclothes', '👗', 'New clothes', 'नए कपड़े'),
      w('pk-sparkler', '🎇', 'Sparkler', 'फुलझड़ी'),
      w('pk-tooloud', '🙉', 'Too loud', 'बहुत शोर'),
      w('pk-happydiwali', '🪔', 'Happy Diwali', 'दिवाली मुबारक'),
    ],
  },
  {
    id: 'pack-pongal',
    emoji: '🌾',
    en: 'Pongal',
    hi: 'पोंगल',
    color: '#FFFDE7',
    colorDark: '#F9A825',
    level: 1,
    group: 'talk',
    words: [
      w('pk-pongalpot', '🍚', 'Pongal pot', 'पोंगल'),
      w('pk-sugarcane', '🎋', 'Sugarcane', 'गन्ना'),
      w('pk-kite', '🪁', 'Kite', 'पतंग'),
      w('pk-cow', '🐄', 'Cow', 'गाय'),
      w('pk-turmeric', '🟡', 'Turmeric', 'हल्दी'),
      w('pk-sun', '☀️', 'Sun', 'सूरज'),
      w('pk-bonfire', '🔥', 'Bonfire', 'अलाव'),
      w('pk-happypongal', '🌾', 'Happy Pongal', 'पोंगल की शुभकामनाएँ'),
    ],
  },
  {
    id: 'pack-eid',
    emoji: '🌙',
    en: 'Eid',
    hi: 'ईद',
    color: '#E8F5E9',
    colorDark: '#2E7D32',
    level: 1,
    group: 'talk',
    words: [
      w('pk-moon', '🌙', 'Moon', 'चाँद'),
      w('pk-mosque', '🕌', 'Mosque', 'मस्जिद'),
      w('pk-sewai', '🍜', 'Sewai', 'सेवई'),
      w('pk-eidi', '🎁', 'Eidi', 'ईदी'),
      w('pk-hug', '🤗', 'Hug', 'गले लगना'),
      w('pk-perfume', '🌸', 'Perfume', 'इत्र'),
      w('pk-eidmubarak', '🌙', 'Eid Mubarak', 'ईद मुबारक'),
      w('pk-guests', '👨‍👩‍👧', 'Guests', 'मेहमान'),
    ],
  },
  {
    id: 'pack-doctor',
    emoji: '🩺',
    en: 'Doctor visit',
    hi: 'डॉक्टर के पास',
    color: '#E1F5FE',
    colorDark: '#0277BD',
    level: 1,
    group: 'talk',
    words: [
      w('pk-waiting', '⏳', 'Waiting', 'इंतज़ार'),
      w('pk-mouthopen', '👄', 'Open my mouth', 'मुँह खोलो'),
      w('pk-injection', '💉', 'Injection', 'सुई'),
      w('pk-medicine', '💊', 'Medicine', 'दवा'),
      w('pk-bandage', '🩹', 'Bandage', 'पट्टी'),
      w('pk-scared', '😨', 'I am scared', 'मुझे डर लग रहा है'),
      w('pk-hurtshere', '🤕', 'It hurts here', 'यहाँ दर्द है'),
      w('pk-alldone', '✅', 'All done', 'हो गया'),
    ],
  },
  {
    id: 'pack-temple',
    emoji: '🛕',
    en: 'Temple',
    hi: 'मंदिर',
    color: '#FFF8E1',
    colorDark: '#EF6C00',
    level: 1,
    group: 'talk',
    words: [
      w('pk-temple', '🛕', 'Temple', 'मंदिर'),
      w('pk-shoesoff', '🩴', 'Shoes off', 'चप्पल बाहर'),
      w('pk-bell', '🔔', 'Bell', 'घंटी'),
      w('pk-flowers', '🌺', 'Flowers', 'फूल'),
      w('pk-prasad', '🍯', 'Prasad', 'प्रसाद'),
      w('pk-pray', '🙏', 'Pray', 'प्रार्थना'),
      w('pk-quiet', '🤫', 'Be quiet', 'चुप रहो'),
      w('pk-goouts', '🚪', 'I want to go out', 'बाहर जाना है'),
    ],
  },
  {
    id: 'pack-school',
    emoji: '🏫',
    en: 'School day',
    hi: 'स्कूल का दिन',
    color: '#EDE7F6',
    colorDark: '#4527A0',
    level: 1,
    group: 'talk',
    words: [
      w('pk-uniform', '👕', 'Uniform', 'यूनिफ़ॉर्म'),
      w('pk-schoolbag', '🎒', 'School bag', 'बस्ता'),
      w('pk-assembly', '🧍', 'Assembly', 'प्रार्थना सभा'),
      w('pk-tiffin', '🍱', 'Tiffin', 'टिफ़िन'),
      w('pk-homework', '📝', 'Homework', 'गृहकार्य'),
      w('pk-toiletpass', '🚽', 'May I go to the toilet', 'टॉयलेट जाना है'),
      w('pk-idontknow', '🤷', 'I do not know', 'मुझे नहीं पता'),
      w('pk-gohome', '🏠', 'Go home', 'घर जाना है'),
    ],
  },
];

export const packById = (id: string) => PACKS.find((p) => p.id === id);
