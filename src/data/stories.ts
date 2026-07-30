/**
 * Read-aloud picture stories and rhymes. Each line has an emoji "scene"
 * (art[i]) shown large while the line is spoken, like a picture book page.
 * Hindi text is used in Hindi mode when present; other languages fall back to
 * English. Stories are our own simple retellings of ancient fables; rhymes are
 * traditional public-domain classics.
 */

export interface Story {
  id: string;
  emoji: string;
  kind: 'story' | 'rhyme';
  title: { en: string; hi?: string };
  lines: { en: string[]; hi?: string[] };
  /** one emoji scene per line */
  art: string[];
}

export const STORIES: Story[] = [
  {
    id: 'thirsty-crow',
    emoji: '🐦‍⬛',
    kind: 'story',
    title: { en: 'The Thirsty Crow', hi: 'प्यासा कौआ' },
    art: ['🌞🥵', '🐦‍⬛💧', '🏺💧', '🐦‍⬛🏺', '🐦‍⬛💡', '🪨🪨🏺', '💧⬆️⬆️', '🐦‍⬛😊💨'],
    lines: {
      en: [
        'It was a very hot day.',
        'A crow was very, very thirsty.',
        'He found a pot with a little water at the bottom.',
        'His beak could not reach the water.',
        'The clever crow had an idea!',
        'He dropped small stones into the pot, one by one.',
        'The water came up, up, up!',
        'The crow drank the water and flew away happily.',
      ],
      hi: [
        'बहुत गर्मी का दिन था।',
        'एक कौआ बहुत प्यासा था।',
        'उसे एक घड़ा मिला, जिसमें थोड़ा पानी था।',
        'उसकी चोंच पानी तक नहीं पहुँची।',
        'चतुर कौए को एक उपाय सूझा!',
        'उसने घड़े में एक-एक करके छोटे कंकड़ डाले।',
        'पानी ऊपर आता गया!',
        'कौए ने पानी पिया और खुश होकर उड़ गया।',
      ],
    },
  },
  {
    id: 'hare-tortoise',
    emoji: '🐢',
    kind: 'story',
    title: { en: 'The Hare and the Tortoise', hi: 'खरगोश और कछुआ' },
    art: ['🐰😂🐢', '🐢🏁', '🐰💨💨', '🐰😴🌳', '🐢🚶🚶', '🐢🏁🎉', '🏆🐢'],
    lines: {
      en: [
        'A hare laughed at a slow tortoise.',
        '"Let us have a race!" said the tortoise.',
        'The hare ran very fast, far ahead.',
        '"I have lots of time," he said, and slept under a tree.',
        'The tortoise walked slowly, slowly, without stopping.',
        'When the hare woke up, the tortoise was at the finish line!',
        'Slow and steady wins the race.',
      ],
      hi: [
        'एक खरगोश धीमे कछुए पर हँसा।',
        'कछुए ने कहा, "चलो दौड़ लगाएँ!"',
        'खरगोश बहुत तेज़ दौड़ा, बहुत आगे।',
        '"मेरे पास बहुत समय है," कहकर वह पेड़ के नीचे सो गया।',
        'कछुआ धीरे-धीरे चलता रहा, बिना रुके।',
        'जब खरगोश जागा, कछुआ जीत की रेखा पर था!',
        'धीरे और लगातार चलने वाला ही जीतता है।',
      ],
    },
  },
  {
    id: 'lion-mouse',
    emoji: '🦁',
    kind: 'story',
    title: { en: 'The Lion and the Mouse', hi: 'शेर और चूहा' },
    art: ['🐭🦁😴', '🦁😠🐭', '🐭🙏', '🦁😄', '🦁🕸️😟', '🐭🦷🕸️', '🦁🎉', '🐭❤️🦁'],
    lines: {
      en: [
        'A little mouse ran over a sleeping lion.',
        'The lion woke up and caught the mouse.',
        '"Please let me go," said the mouse. "One day I will help you."',
        'The lion laughed and let him go.',
        "One day, the lion got caught in a hunter's net.",
        'The little mouse came and cut the net with his teeth.',
        'The lion was free!',
        'Even small friends can be big helpers.',
      ],
      hi: [
        'एक छोटा चूहा सोते हुए शेर के ऊपर से भागा।',
        'शेर जाग गया और उसने चूहे को पकड़ लिया।',
        'चूहे ने कहा, "मुझे छोड़ दो, एक दिन मैं तुम्हारी मदद करूँगा।"',
        'शेर हँसा और उसे छोड़ दिया।',
        'एक दिन शेर शिकारी के जाल में फँस गया।',
        'छोटा चूहा आया और अपने दाँतों से जाल काट दिया।',
        'शेर आज़ाद हो गया!',
        'छोटे दोस्त भी बड़े काम आते हैं।',
      ],
    },
  },
  {
    id: 'little-seed',
    emoji: '🌱',
    kind: 'story',
    title: { en: 'The Little Seed', hi: 'नन्हा बीज' },
    art: ['🌰😴', '🌧️💧💧', '🌞🔆', '🌰🌱', '🌱⬆️⬆️', '🍃🌸', '🌻😊'],
    lines: {
      en: [
        'A little seed slept under the ground.',
        'The rain came. Drip, drip, drip!',
        'The sun came. Warm, warm, warm!',
        'The seed woke up and pushed out a tiny root.',
        'Then a little green shoot came up, up, up.',
        'Leaves opened. A flower bloomed!',
        'The little seed became a beautiful plant.',
      ],
      hi: [
        'एक नन्हा बीज ज़मीन के नीचे सोया था।',
        'बारिश आई। टिप, टिप, टिप!',
        'धूप आई। गरम, गरम, गरम!',
        'बीज जागा और उसने नन्ही जड़ निकाली।',
        'फिर एक हरी कोंपल ऊपर आई।',
        'पत्ते खुले। फूल खिला!',
        'नन्हा बीज एक सुंदर पौधा बन गया।',
      ],
    },
  },
  {
    id: 'monkey-cap',
    emoji: '🐵',
    kind: 'story',
    title: { en: 'The Cap Seller and the Monkeys', hi: 'टोपीवाला और बंदर' },
    art: ['🧢😴🌳', '🐵🐵🧢', '🐵🧢😟', '🤔💡', '🧢⬇️', '🐵🧢⬇️⬇️', '😊🧢🏠'],
    lines: {
      en: [
        'A cap seller slept under a big tree.',
        'Monkeys took all his caps and climbed the tree!',
        'Each monkey wore a cap. The cap seller was sad.',
        'Then he had an idea.',
        'He threw his own cap on the ground.',
        'The monkeys copied him and threw all the caps down!',
        'The happy cap seller picked up his caps and went home.',
      ],
      hi: [
        'एक टोपीवाला बड़े पेड़ के नीचे सो गया।',
        'बंदर उसकी सारी टोपियाँ लेकर पेड़ पर चढ़ गए!',
        'हर बंदर ने टोपी पहन ली। टोपीवाला उदास हो गया।',
        'फिर उसे एक उपाय सूझा।',
        'उसने अपनी टोपी ज़मीन पर फेंक दी।',
        'बंदरों ने नकल की और सारी टोपियाँ नीचे फेंक दीं!',
        'खुश टोपीवाला टोपियाँ उठाकर घर चला गया।',
      ],
    },
  },
  {
    id: 'ant-dove',
    emoji: '🕊️',
    kind: 'story',
    title: { en: 'The Ant and the Dove', hi: 'चींटी और कबूतर' },
    art: ['🐜🌊', '🐜😱', '🕊️🍃', '🐜🍃😊', '🏹🕊️', '🐜🦶', '🕊️💨✨', '🐜🤝🕊️'],
    lines: {
      en: [
        'A little ant fell into the river.',
        '"Help! Help!" cried the ant.',
        'A kind dove dropped a leaf into the water.',
        'The ant climbed onto the leaf and was safe.',
        'One day, a hunter aimed at the dove.',
        'The ant bit his foot. Ouch!',
        'The dove flew away safely.',
        'Friends help each other.',
      ],
      hi: [
        'एक छोटी चींटी नदी में गिर गई।',
        'चींटी चिल्लाई, "बचाओ! बचाओ!"',
        'एक दयालु कबूतर ने पानी में पत्ता गिराया।',
        'चींटी पत्ते पर चढ़ गई और बच गई।',
        'एक दिन एक शिकारी ने कबूतर पर निशाना लगाया।',
        'चींटी ने उसके पैर में काटा। आह!',
        'कबूतर सुरक्षित उड़ गया।',
        'दोस्त एक-दूसरे की मदद करते हैं।',
      ],
    },
  },
  {
    id: 'fox-grapes',
    emoji: '🦊',
    kind: 'story',
    title: { en: 'The Fox and the Grapes', hi: 'लोमड़ी और अंगूर' },
    art: ['🦊🍇', '🍇⬆️🌿', '🦊🦘🦘', '🦊😩', '🦊😤🚶'],
    lines: {
      en: [
        'A hungry fox saw juicy grapes.',
        'They hung high, high on the vine.',
        'He jumped and jumped and jumped.',
        'He could not reach them.',
        '"Those grapes are sour anyway!" he said, and walked away.',
      ],
      hi: [
        'एक भूखी लोमड़ी ने रसीले अंगूर देखे।',
        'वे बेल पर बहुत ऊँचे लटके थे।',
        'वह उछली, उछली और उछली।',
        'वह उन तक नहीं पहुँच सकी।',
        '"अंगूर खट्टे हैं!" कहकर वह चली गई।',
      ],
    },
  },
  {
    id: 'red-kite',
    emoji: '🪁',
    kind: 'story',
    title: { en: "Ravi's Red Kite", hi: 'रवि की लाल पतंग' },
    art: ['🧒🪁', '🏃👧🏠', '🌬️💨', '🪁☁️⬆️', '🐦🪁', '🌇🧵', '😊🪁🌙'],
    lines: {
      en: [
        'Ravi had a beautiful red kite.',
        'He ran to the terrace with his sister Meena.',
        'The wind blew. Whoosh, whoosh!',
        'The kite went up, up, up in the blue sky.',
        'A bird flew beside the kite. Hello, bird!',
        'At sunset, Ravi rolled the string back home.',
        '"Tomorrow we will fly again!" said Ravi.',
      ],
      hi: [
        'रवि के पास एक सुंदर लाल पतंग थी।',
        'वह अपनी बहन मीना के साथ छत पर भागा।',
        'हवा चली। सर्र, सर्र!',
        'पतंग नीले आसमान में ऊपर, ऊपर गई।',
        'एक चिड़िया पतंग के पास उड़ी। नमस्ते चिड़िया!',
        'शाम को रवि ने डोर लपेट ली।',
        'रवि बोला, "कल फिर उड़ाएँगे!"',
      ],
    },
  },
  {
    id: 'elephant-bath',
    emoji: '🐘',
    kind: 'story',
    title: { en: "Little Elephant's Bath", hi: 'नन्हे हाथी का स्नान' },
    art: ['🐘🛁', '🙅🐘', '🐘🟤🟤', '🪰🪰🪰', '🐘😫', '🐘💦💦', '🐘😄🫧'],
    lines: {
      en: [
        'Little elephant did not like baths.',
        '"No bath! No bath!" he said.',
        'He played in the mud all day.',
        'Then the flies came. Bzzz, bzzz!',
        '"Mama, the flies!" he cried.',
        'Mama sprayed cool water with her trunk.',
        '"Aaah! Baths are fun!" laughed little elephant.',
      ],
      hi: [
        'नन्हे हाथी को नहाना पसंद नहीं था।',
        'वह बोला, "नहीं नहाऊँगा!"',
        'वह दिन भर कीचड़ में खेला।',
        'फिर मक्खियाँ आ गईं। भन-भन!',
        'वह चिल्लाया, "माँ, मक्खियाँ!"',
        'माँ ने सूँड से ठंडा पानी छिड़का।',
        'नन्हा हाथी हँसा, "वाह! नहाना तो मज़ेदार है!"',
      ],
    },
  },
  // ---------- Rhymes (traditional, public domain) ----------
  {
    id: 'twinkle',
    emoji: '⭐',
    kind: 'rhyme',
    title: { en: 'Twinkle Twinkle', hi: 'ट्विंकल ट्विंकल' },
    art: ['⭐✨', '🤔⭐', '🌍⬆️', '💎🌌', '⭐✨', '🤔⭐'],
    lines: {
      en: [
        'Twinkle, twinkle, little star,',
        'How I wonder what you are!',
        'Up above the world so high,',
        'Like a diamond in the sky.',
        'Twinkle, twinkle, little star,',
        'How I wonder what you are!',
      ],
    },
  },
  {
    id: 'baa-baa',
    emoji: '🐑',
    kind: 'rhyme',
    title: { en: 'Baa Baa Black Sheep', hi: 'बा बा ब्लैक शीप' },
    art: ['🐑', '🧶❓', '🐑👍', '🧺🧺🧺', '👨', '👩', '👦', '🏘️'],
    lines: {
      en: [
        'Baa, baa, black sheep,',
        'Have you any wool?',
        'Yes sir, yes sir,',
        'Three bags full.',
        'One for the master,',
        'One for the dame,',
        'And one for the little boy',
        'Who lives down the lane.',
      ],
    },
  },
  {
    id: 'rain-rain',
    emoji: '🌧️',
    kind: 'rhyme',
    title: { en: 'Rain Rain Go Away', hi: 'रेन रेन गो अवे' },
    art: ['🌧️👋', '📅🌧️', '🧒⚽', '☀️😊'],
    lines: {
      en: [
        'Rain, rain, go away,',
        'Come again another day.',
        'Little children want to play,',
        'Rain, rain, go away.',
      ],
    },
  },
  {
    id: 'humpty',
    emoji: '🥚',
    kind: 'rhyme',
    title: { en: 'Humpty Dumpty', hi: 'हम्प्टी डम्प्टी' },
    art: ['🥚🧱', '🥚💥', '🐴💂', '🥚😢'],
    lines: {
      en: [
        'Humpty Dumpty sat on a wall,',
        'Humpty Dumpty had a great fall.',
        "All the king's horses and all the king's men",
        "Couldn't put Humpty together again.",
      ],
    },
  },
  {
    id: 'jack-jill',
    emoji: '⛰️',
    kind: 'rhyme',
    title: { en: 'Jack and Jill', hi: 'जैक एंड जिल' },
    art: ['👦👧⛰️', '🪣💧', '👦🤕', '👧💫'],
    lines: {
      en: [
        'Jack and Jill went up the hill',
        'To fetch a pail of water.',
        'Jack fell down and broke his crown,',
        'And Jill came tumbling after.',
      ],
    },
  },
  {
    id: 'chubby-cheeks',
    emoji: '😊',
    kind: 'rhyme',
    title: { en: 'Chubby Cheeks', hi: 'चब्बी चीक्स' },
    art: ['😊👶', '👄🦷', '💇✨', '👀💙', '🧑‍🏫⭐', '🙋😄'],
    lines: {
      en: [
        'Chubby cheeks, dimple chin,',
        'Rosy lips, teeth within.',
        'Curly hair, very fair,',
        'Eyes are blue, lovely too.',
        "Teacher's pet, is that you?",
        'Yes, yes, yes!',
      ],
    },
  },
  {
    id: 'machhli',
    emoji: '🐟',
    kind: 'rhyme',
    title: { en: 'Machhli Jal Ki Rani', hi: 'मछली जल की रानी' },
    art: ['🐟👑', '💧🐟', '✋🐟😨', '🐟💔'],
    lines: {
      en: [
        'Machhli jal ki rani hai,',
        'Jeevan uska paani hai.',
        'Haath lagao, dar jayegi,',
        'Bahar nikalo, mar jayegi.',
      ],
      hi: [
        'मछली जल की रानी है,',
        'जीवन उसका पानी है।',
        'हाथ लगाओ, डर जाएगी,',
        'बाहर निकालो, मर जाएगी।',
      ],
    },
  },
];
