import type { Story } from './stories';

/**
 * Everyday routines, one step to a page.
 *
 * This is a visual task analysis: the thing an occupational therapist tapes
 * above a washbasin, broken into steps a child can follow and, crucially, can
 * follow *again tomorrow without being told*. Independence at the basin is
 * worth more than another twenty animal names.
 *
 * They are stories as far as the app is concerned — same player, same page
 * turning, same read-aloud — because a routine is exactly a picture book about
 * something the child is about to do.
 *
 * Rules the steps follow:
 *  - one action per page, in the order a body actually does it
 *  - said to the child, not about them: "wet your hands", not "the child wets"
 *  - no praise inside the steps; finishing is the reward
 *  - the last page is always the finished state, so the end is unmistakable
 */
export const ROUTINES: Story[] = [
  {
    id: 'wash-hands',
    emoji: '🧼',
    kind: 'routine',
    title: { en: 'Washing my hands', hi: 'हाथ धोना' },
    art: ['🚰', '💦🖐️', '🧼🖐️', '👐🫧', '🖐️🫧', '💦👐', '🧻🖐️', '✨🖐️'],
    lines: {
      en: [
        'Turn on the tap.',
        'Wet your hands.',
        'Take a little soap.',
        'Rub your palms together.',
        'Rub the back of each hand.',
        'Wash the soap away.',
        'Dry your hands on the towel.',
        'All clean.',
      ],
      hi: [
        'नल खोलो।',
        'हाथ गीले करो।',
        'थोड़ा साबुन लो।',
        'दोनों हथेलियाँ रगड़ो।',
        'हाथ के पीछे भी रगड़ो।',
        'साबुन धो डालो।',
        'तौलिये से हाथ पोंछो।',
        'हाथ साफ़ हो गए।',
      ],
    },
  },
  {
    id: 'brush-teeth',
    emoji: '🪥',
    kind: 'routine',
    title: { en: 'Brushing my teeth', hi: 'दाँत साफ़ करना' },
    art: ['🪥', '💧🪥', '🦷🪥', '😬🪥', '⬆️⬇️🪥', '👅🪥', '💧👄', '😁✨'],
    lines: {
      en: [
        'Pick up your brush.',
        'Wet the brush.',
        'Put a little paste on it.',
        'Brush the front teeth.',
        'Brush up and down at the back.',
        'Brush your tongue gently.',
        'Rinse your mouth with water.',
        'Shiny teeth. All done.',
      ],
      hi: [
        'अपना ब्रश उठाओ।',
        'ब्रश गीला करो।',
        'थोड़ा पेस्ट लगाओ।',
        'आगे के दाँत साफ़ करो।',
        'पीछे के दाँत ऊपर-नीचे साफ़ करो।',
        'जीभ धीरे से साफ़ करो।',
        'पानी से कुल्ला करो।',
        'दाँत चमक गए। हो गया।',
      ],
    },
  },
  {
    id: 'toilet',
    emoji: '🚽',
    kind: 'routine',
    title: { en: 'Going to the toilet', hi: 'टॉयलेट जाना' },
    art: ['🚽', '🚪', '👖⬇️', '🚽🧍', '🧻', '👖⬆️', '🚿🚽', '🧼🖐️'],
    lines: {
      en: [
        'Tell someone: toilet.',
        'Go in and close the door.',
        'Pull your clothes down.',
        'Sit down and wait.',
        'Clean yourself.',
        'Pull your clothes up.',
        'Flush or pour the water.',
        'Wash your hands.',
      ],
      hi: [
        'किसी को बताओ: टॉयलेट।',
        'अंदर जाओ और दरवाज़ा बंद करो।',
        'कपड़े नीचे करो।',
        'बैठो और इंतज़ार करो।',
        'सफ़ाई करो।',
        'कपड़े ऊपर करो।',
        'फ्लश करो या पानी डालो।',
        'हाथ धोओ।',
      ],
    },
  },
  {
    id: 'getting-dressed',
    emoji: '👕',
    kind: 'routine',
    title: { en: 'Getting dressed', hi: 'कपड़े पहनना' },
    art: ['👕👖', '🩲', '👖', '👕', '🧦', '👟', '🪮', '🎒'],
    lines: {
      en: [
        'Choose your clothes.',
        'Put on your underclothes.',
        'One leg, then the other leg.',
        'Head first, then both arms.',
        'Put on your socks.',
        'Put on your shoes.',
        'Comb your hair.',
        'Ready to go.',
      ],
      hi: [
        'अपने कपड़े चुनो।',
        'अंदर के कपड़े पहनो।',
        'एक पैर, फिर दूसरा पैर।',
        'पहले सिर, फिर दोनों हाथ।',
        'मोज़े पहनो।',
        'जूते पहनो।',
        'बाल बनाओ।',
        'तैयार।',
      ],
    },
  },
  {
    id: 'eating',
    emoji: '🍽️',
    kind: 'routine',
    title: { en: 'Eating my food', hi: 'खाना खाना' },
    art: ['🧼🖐️', '🪑', '🍽️', '🥄', '😋', '💧', '🍽️✨', '🧼🖐️'],
    lines: {
      en: [
        'Wash your hands first.',
        'Sit down at your place.',
        'Look at your plate.',
        'Take a small bite.',
        'Chew slowly.',
        'Drink some water.',
        'Finished? Say all done.',
        'Wash your hands again.',
      ],
      hi: [
        'पहले हाथ धोओ।',
        'अपनी जगह पर बैठो।',
        'अपनी थाली देखो।',
        'छोटा कौर लो।',
        'धीरे-धीरे चबाओ।',
        'थोड़ा पानी पियो।',
        'हो गया? "हो गया" बोलो।',
        'फिर से हाथ धोओ।',
      ],
    },
  },
  {
    id: 'bath',
    emoji: '🛁',
    kind: 'routine',
    title: { en: 'Having a bath', hi: 'नहाना' },
    art: ['🪣', '👕⬇️', '💦', '🧼', '🫧', '🚿', '🧻', '👕⬆️'],
    lines: {
      en: [
        'Fill the bucket with warm water.',
        'Take off your clothes.',
        'Pour water on your body.',
        'Take the soap.',
        'Rub the soap everywhere.',
        'Pour water until the soap is gone.',
        'Dry yourself with the towel.',
        'Put on clean clothes.',
      ],
      hi: [
        'बाल्टी में गुनगुना पानी भरो।',
        'कपड़े उतारो।',
        'शरीर पर पानी डालो।',
        'साबुन लो।',
        'पूरे शरीर पर साबुन लगाओ।',
        'साबुन जाने तक पानी डालो।',
        'तौलिये से पोंछो।',
        'साफ़ कपड़े पहनो।',
      ],
    },
  },
  {
    id: 'bedtime',
    emoji: '🛏️',
    kind: 'routine',
    title: { en: 'Going to bed', hi: 'सोने जाना' },
    art: ['🌙', '🪥', '🚽', '👕', '📖', '💡⬇️', '🛏️', '😴'],
    lines: {
      en: [
        'It is night time now.',
        'Brush your teeth.',
        'Go to the toilet.',
        'Put on your night clothes.',
        'One story.',
        'Lights off.',
        'Lie down in bed.',
        'Good night.',
      ],
      hi: [
        'अब रात हो गई है।',
        'दाँत साफ़ करो।',
        'टॉयलेट जाओ।',
        'रात के कपड़े पहनो।',
        'एक कहानी।',
        'बत्ती बंद।',
        'बिस्तर पर लेट जाओ।',
        'शुभ रात्रि।',
      ],
    },
  },
  {
    id: 'school-morning',
    emoji: '🎒',
    kind: 'routine',
    title: { en: 'Getting ready for school', hi: 'स्कूल के लिए तैयार होना' },
    art: ['⏰', '🚽', '🪥', '👕', '🍽️', '🎒', '👟', '👋'],
    lines: {
      en: [
        'Wake up.',
        'Go to the toilet.',
        'Brush your teeth.',
        'Put on your uniform.',
        'Eat your breakfast.',
        'Pack your bag.',
        'Put on your shoes.',
        'Say bye and go.',
      ],
      hi: [
        'उठो।',
        'टॉयलेट जाओ।',
        'दाँत साफ़ करो।',
        'यूनिफ़ॉर्म पहनो।',
        'नाश्ता करो।',
        'बैग तैयार करो।',
        'जूते पहनो।',
        'बाय बोलकर जाओ।',
      ],
    },
  },
];

/**
 * Social scripts: what is about to happen, and what I can do about it.
 *
 * A routine is for a body ("wet your hands"). A script is for a situation the
 * child cannot control — a visitor arriving, a stranger asking their name, a
 * barber with scissors. Read beforehand, it turns an ambush into something
 * expected, and every one of these ends by naming the way out: the word the
 * child can press if it becomes too much.
 *
 * They are written honestly. "It might feel itchy" is more use to a child than
 * "it will be fun", because when it *is* itchy the book has not lied to them.
 */
export const SOCIAL_SCRIPTS: Story[] = [
  {
    id: 'visitor',
    emoji: '🚪',
    kind: 'routine',
    title: { en: 'When someone comes to visit', hi: 'जब कोई घर आता है' },
    art: ['🔔', '🚪', '👋', '🙏', '🪑', '🗣️', '🚶', '🛑'],
    lines: {
      en: [
        'The bell rings.',
        'Amma or Appa opens the door.',
        'A visitor comes in.',
        'I can wave, or press hello.',
        'They may sit and talk for a long time.',
        'The talking is not about me. I do not have to answer.',
        'I can go to my room when I want.',
        'If it is too much, I press: too loud.',
      ],
      hi: [
        'घंटी बजती है।',
        'माँ या पापा दरवाज़ा खोलते हैं।',
        'कोई मेहमान आता है।',
        'मैं हाथ हिला सकता हूँ, या नमस्ते दबा सकता हूँ।',
        'वे बैठकर बहुत देर बातें कर सकते हैं।',
        'बातें मेरे बारे में नहीं हैं। मुझे जवाब देना ज़रूरी नहीं।',
        'मैं जब चाहूँ अपने कमरे में जा सकता हूँ।',
        'ज़्यादा हो जाए तो मैं दबाता हूँ: बहुत शोर है।',
      ],
    },
  },
  {
    id: 'my-name',
    emoji: '🙋',
    kind: 'routine',
    title: { en: 'When someone asks my name', hi: 'जब कोई मेरा नाम पूछता है' },
    art: ['🗣️', '👀', '📱', '👆', '🔊', '🙂', '⏳', '🛑'],
    lines: {
      en: [
        'Someone asks: what is your name?',
        'They are waiting for me.',
        'I pick up my tablet.',
        'I press my name.',
        'The tablet says it for me.',
        'That is a real answer. It counts.',
        'Some people wait. Some people do not. Both happen.',
        'If I do not want to answer, I do not have to.',
      ],
      hi: [
        'कोई पूछता है: तुम्हारा नाम क्या है?',
        'वे मेरा इंतज़ार कर रहे हैं।',
        'मैं अपना टैबलेट उठाता हूँ।',
        'मैं अपना नाम दबाता हूँ।',
        'टैबलेट मेरे लिए बोल देता है।',
        'यह सच्चा जवाब है। यही काफ़ी है।',
        'कुछ लोग रुकते हैं, कुछ नहीं। दोनों होता है।',
        'अगर मैं जवाब नहीं देना चाहता, तो ज़रूरी नहीं।',
      ],
    },
  },
  {
    id: 'shop',
    emoji: '🏪',
    kind: 'routine',
    title: { en: 'Going to the shop', hi: 'दुकान जाना' },
    art: ['🏪', '🧺', '👀', '👆', '🧾', '💵', '🛍️', '👋'],
    lines: {
      en: [
        'We go into the shop.',
        'We take a basket.',
        'I look at the things.',
        'I can point, or press what I want.',
        'Amma pays at the counter.',
        'We wait our turn in the line.',
        'We carry the bag out.',
        'We say bye and go home.',
      ],
      hi: [
        'हम दुकान में जाते हैं।',
        'हम एक टोकरी लेते हैं।',
        'मैं चीज़ें देखता हूँ।',
        'मैं इशारा कर सकता हूँ, या जो चाहिए वह दबा सकता हूँ।',
        'माँ काउंटर पर पैसे देती हैं।',
        'हम लाइन में अपनी बारी का इंतज़ार करते हैं।',
        'हम थैला लेकर बाहर आते हैं।',
        'हम बाय कहकर घर जाते हैं।',
      ],
    },
  },
  {
    id: 'doctor-visit',
    emoji: '🩺',
    kind: 'routine',
    title: { en: 'Going to the doctor', hi: 'डॉक्टर के पास जाना' },
    art: ['🏥', '🪑', '📛', '🩺', '👅', '💉', '🩹', '🚗'],
    lines: {
      en: [
        'We go to the doctor.',
        'We sit and wait. Waiting can be long.',
        'They call our name.',
        'The doctor listens to my chest. It is cold, not sore.',
        'They may ask me to open my mouth.',
        'There may be an injection. It hurts for a moment.',
        'Then a bandage, and it is finished.',
        'I can press: I am scared, or it hurts here.',
      ],
      hi: [
        'हम डॉक्टर के पास जाते हैं।',
        'हम बैठकर इंतज़ार करते हैं। इंतज़ार लंबा हो सकता है।',
        'वे हमारा नाम पुकारते हैं।',
        'डॉक्टर मेरी छाती सुनते हैं। ठंडा लगता है, दर्द नहीं।',
        'वे मुँह खोलने को कह सकते हैं।',
        'इंजेक्शन लग सकता है। एक पल दर्द होता है।',
        'फिर पट्टी, और हो गया।',
        'मैं दबा सकता हूँ: मुझे डर लग रहा है, या यहाँ दर्द है।',
      ],
    },
  },
  {
    id: 'haircut',
    emoji: '💇',
    kind: 'routine',
    title: { en: 'Getting a haircut', hi: 'बाल कटवाना' },
    art: ['💇', '🪑', '🧥', '✂️', '🔊', '🤏', '🪮', '✨'],
    lines: {
      en: [
        'We go for a haircut.',
        'I sit in the big chair.',
        'A cloth goes around me. It is not tight.',
        'The scissors go snip, snip.',
        'The machine buzzes. It tickles.',
        'Hair falls. It can feel itchy.',
        'Then they brush it away.',
        'If I need it to stop, I press: stop.',
      ],
      hi: [
        'हम बाल कटवाने जाते हैं।',
        'मैं बड़ी कुर्सी पर बैठता हूँ।',
        'मेरे चारों ओर कपड़ा लगता है। यह कसा नहीं है।',
        'कैंची चलती है — कट, कट।',
        'मशीन आवाज़ करती है। गुदगुदी लगती है।',
        'बाल गिरते हैं। खुजली लग सकती है।',
        'फिर वे झाड़ देते हैं।',
        'रुकवाना हो तो मैं दबाता हूँ: रुको।',
      ],
    },
  },
];
