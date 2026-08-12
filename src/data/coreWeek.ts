/**
 * Word of the week — content for the grown-up, not the child.
 *
 * The best-evidenced thing anyone can do for a child learning AAC is to *use*
 * the board themselves: tap a word while saying it, in the moment it means
 * something, expecting no reply. It is called aided language modelling, and it
 * is also the thing parents are given least help with. "Model core words" is
 * true and useless; "say STOP when you switch the fan off" is something a
 * tired parent can do this evening.
 *
 * So each week names one word and five ordinary moments to use it in. The
 * moments are deliberately unremarkable — a kitchen, a fan, a scooter, a
 * grandmother arriving — because that is where language is actually learned.
 *
 * `why` explains what the word buys the child, so a parent can tell that this
 * is not a spelling list.
 */

export interface CoreWeekWord {
  /** id in the vocabulary, so the card can show the child's own tile */
  id: string;
  why: string;
  whyHi: string;
  /** five concrete moments; short enough to remember without re-reading */
  moments: string[];
  momentsHi: string[];
}

export const CORE_WEEK: CoreWeekWord[] = [
  {
    id: 'more',
    why: 'The first word that gives a child control. "More" works on food, on play, on tickling, on a song — one word, a hundred uses, and it never needs a noun to be understood.',
    whyHi: 'पहला शब्द जो बच्चे को नियंत्रण देता है। "और" खाने पर, खेल पर, गाने पर — हर जगह काम करता है।',
    moments: [
      'Give a small piece of biscuit, then wait with the board in reach',
      'Push the swing once. Stop. Look at them, and wait',
      'Tap MORE yourself and blow one more bubble',
      'Serve half a spoon of rice, not a full plate',
      'Sing one line of a rhyme and pause',
    ],
    momentsHi: [
      'बिस्कुट का छोटा टुकड़ा दें, फिर बोर्ड पास रखकर रुकें',
      'झूला एक बार झुलाएँ। रुकें। उनकी ओर देखें और इंतज़ार करें',
      'खुद "और" दबाएँ और एक बुलबुला बनाएँ',
      'आधा चम्मच चावल दें, पूरी थाली नहीं',
      'कविता की एक लाइन गाएँ और रुक जाएँ',
    ],
  },
  {
    id: 'again',
    why: 'A child who cannot say "again" has to hope the good thing happens twice. It turns an accident into a request.',
    whyHi: 'जो बच्चा "फिर से" नहीं कह सकता, उसे अच्छी बात दोबारा होने की उम्मीद ही करनी पड़ती है।',
    moments: [
      'Spin them around once, then wait',
      'Play their favourite song and stop it after the chorus',
      'Throw the ball once and hold the second throw',
      'Tap AGAIN yourself before repeating anything they enjoyed',
      'At bedtime, ask with the board which story to read again',
    ],
    momentsHi: [
      'एक बार घुमाएँ, फिर रुकें',
      'पसंदीदा गाना बजाएँ और बीच में बंद कर दें',
      'गेंद एक बार फेंकें, दूसरी बार रुक जाएँ',
      'कुछ दोहराने से पहले खुद "फिर से" दबाएँ',
      'सोते समय बोर्ड से पूछें कौन सी कहानी दोबारा सुननी है',
    ],
  },
  {
    id: 'stop',
    why: 'The most important word in the app. A child who can say stop does not have to scream, hit or run to be heard — and being obeyed the first time is what teaches them the word works.',
    whyHi: 'ऐप का सबसे ज़रूरी शब्द। जो बच्चा "रुको" कह सकता है, उसे सुने जाने के लिए चीखना नहीं पड़ता।',
    moments: [
      'Stop the fan, the tap, the music — and tap STOP as you do',
      'When they push your hand away, tap STOP for them and then actually stop',
      'Tickle, and stop the instant they tap it. Every time',
      'Use it during hair-combing and nail-cutting, and honour it',
      'Model it on yourself: tap STOP and stop mid-sentence',
    ],
    momentsHi: [
      'पंखा, नल, संगीत बंद करते समय "रुको" दबाएँ',
      'जब वे आपका हाथ हटाएँ, उनके लिए "रुको" दबाएँ और सच में रुक जाएँ',
      'गुदगुदी करें और जैसे ही वे दबाएँ, तुरंत रुक जाएँ — हर बार',
      'बाल बनाते और नाखून काटते समय इस्तेमाल करें, और उसका पालन करें',
      'खुद पर दिखाएँ: "रुको" दबाकर बात के बीच रुक जाएँ',
    ],
  },
  {
    id: 'want',
    why: 'Turns pointing and crying into asking. Pair it with anything: WANT + water, WANT + outside, WANT + Amma.',
    whyHi: 'इशारा और रोना अब माँगना बन जाता है। किसी भी शब्द के साथ जोड़ें: चाहिए + पानी, चाहिए + बाहर।',
    moments: [
      'Put a favourite thing in sight but out of reach',
      'Offer two snacks and let the board choose',
      'Tap WANT + WATER before handing over the glass',
      'Use it for yourself out loud: "I want tea"',
      'Never make them ask twice once they have used it',
    ],
    momentsHi: [
      'पसंदीदा चीज़ दिखे पर हाथ न पहुँचे, ऐसी जगह रखें',
      'दो नाश्ते दिखाएँ और बोर्ड से चुनने दें',
      'गिलास देने से पहले "चाहिए + पानी" दबाएँ',
      'खुद के लिए बोलकर इस्तेमाल करें: "मुझे चाय चाहिए"',
      'एक बार माँग लिया तो दोबारा माँगने न दें',
    ],
  },
  {
    id: 'help',
    why: 'The alternative to giving up. Most "behaviour" at homework time is a child with no way to say this.',
    whyHi: 'हार मानने का विकल्प। होमवर्क के समय की ज़्यादातर "शैतानी" इसी शब्द की कमी है।',
    moments: [
      'Hand over a tightly closed box',
      'Tap HELP yourself when you cannot open something',
      'Wait three seconds when they struggle before stepping in',
      'Use it at the shoe rack, the tap, the school bag',
      'Answer it immediately, even mid-task',
    ],
    momentsHi: [
      'कसकर बंद डिब्बा उनके हाथ में दें',
      'जब आप कुछ न खोल पाएँ, खुद "मदद" दबाएँ',
      'मुश्किल होने पर तुरंत मदद न करें — तीन सेकंड रुकें',
      'जूते, नल, स्कूल बैग पर इस्तेमाल करें',
      'माँगने पर तुरंत जवाब दें, काम बीच में छोड़कर भी',
    ],
  },
  {
    id: 'go',
    why: 'Movement is what most children want most. GO + park, GO + home, GO + outside puts the day partly in their hands.',
    whyHi: 'बच्चों को सबसे ज़्यादा चाहिए — कहीं जाना। जाना + पार्क, जाना + घर से दिन उनके हाथ में आता है।',
    moments: [
      'At the door, ask with the board where to go',
      'Tap GO before starting the scooter',
      'Use it in the lift, the auto, the bus',
      'Let them tap GO to start a race across the room',
      'Model GO + HOME when leaving anywhere',
    ],
    momentsHi: [
      'दरवाज़े पर बोर्ड से पूछें कहाँ जाना है',
      'स्कूटर चालू करने से पहले "जाना" दबाएँ',
      'लिफ्ट, ऑटो, बस में इस्तेमाल करें',
      'कमरे में दौड़ शुरू करने के लिए उन्हें "जाना" दबाने दें',
      'कहीं से निकलते समय "जाना + घर" दिखाएँ',
    ],
  },
  {
    id: 'finish',
    why: 'Lets a child end something without a fight, and tells you they are done rather than bored, full or overwhelmed.',
    whyHi: 'बच्चा बिना झगड़े किसी काम को खत्म कर सकता है, और आपको पता चलता है कि वे थक गए हैं।',
    moments: [
      'Tap ALL DONE together as you clear the plate',
      'Use it at the end of bath, homework, screen time',
      'Accept it once — even if the plate is half full',
      'Model it on your own tasks out loud',
      'Pair it: ALL DONE + EAT, ALL DONE + BATH',
    ],
    momentsHi: [
      'थाली हटाते समय साथ में "हो गया" दबाएँ',
      'नहाना, होमवर्क, स्क्रीन टाइम खत्म होने पर इस्तेमाल करें',
      'एक बार कह दिया तो मान लें — थाली आधी भरी हो तब भी',
      'अपने कामों पर बोलकर दिखाएँ',
      'जोड़ें: "हो गया + खाना", "हो गया + नहाना"',
    ],
  },
  {
    id: 'f-mine',
    why: 'Ownership and protest in one word. A child with siblings needs this more than they need the names of twenty animals.',
    whyHi: 'अपनापन और विरोध — एक ही शब्द में। भाई-बहन वाले बच्चे को यह बीस जानवरों के नामों से ज़्यादा चाहिए।',
    moments: [
      'When handing back their bag or bottle, tap MINE',
      'Model it during sharing rows instead of settling them for both children',
      'Use it while sorting laundry: mine, Amma\'s, Appa\'s',
      'Let them claim their chair at dinner with it',
      'Respect it when they use it, even about a toy you wanted shared',
    ],
    momentsHi: [
      'उनका बैग या बोतल लौटाते समय "मेरा" दबाएँ',
      'झगड़ा सुलझाने की जगह यह शब्द दिखाएँ',
      'कपड़े छाँटते समय इस्तेमाल करें: मेरा, माँ का, पापा का',
      'खाने की मेज़ पर अपनी कुर्सी बताने दें',
      'जब वे कहें तो मानें — चाहे आप बाँटना चाहते हों',
    ],
  },
  {
    id: 'look',
    why: 'The first word children use to share rather than request — pointing something out just because it is interesting. That is conversation, not shopping.',
    whyHi: 'पहला शब्द जो माँगने के लिए नहीं, बाँटने के लिए है — यही असली बातचीत है।',
    moments: [
      'Tap LOOK at a crow, a bus, a kite — expecting nothing back',
      'Use it when their favourite person walks in',
      'Point out something odd on the way to school',
      'Model LOOK + MOON at night',
      'React with delight when they use it, even at nothing',
    ],
    momentsHi: [
      'कौआ, बस, पतंग दिखाकर "देखो" दबाएँ — जवाब की उम्मीद बिना',
      'उनका पसंदीदा व्यक्ति आए तो इस्तेमाल करें',
      'स्कूल के रास्ते में कुछ अजीब दिखाएँ',
      'रात में "देखो + चाँद" दिखाएँ',
      'जब वे इस्तेमाल करें तो खुश होकर प्रतिक्रिया दें',
    ],
  },
  {
    id: 'quiet',
    why: 'Sensory distress has a word now. "Too loud" said on a board is a child telling you why they are about to fall apart.',
    whyHi: 'अब शोर की तकलीफ का एक शब्द है। "बहुत शोर है" कहना यह बताता है कि वे क्यों परेशान हैं।',
    moments: [
      'Tap it yourself at a loud market or a wedding',
      'Use it before turning the television down',
      'Offer it during festivals and firecrackers',
      'Act on it fast — leave the room, lower the volume',
      'Pair it: TOO LOUD + GO + HOME',
    ],
    momentsHi: [
      'बाज़ार या शादी में खुद दबाएँ',
      'टीवी की आवाज़ कम करने से पहले इस्तेमाल करें',
      'त्योहार और पटाखों के समय दिखाएँ',
      'तुरंत कुछ करें — कमरे से निकलें, आवाज़ कम करें',
      'जोड़ें: "बहुत शोर है + जाना + घर"',
    ],
  },
  {
    id: 'pain',
    why: 'Children who cannot report pain get treated for behaviour instead of illness. Teach this before you need it.',
    whyHi: 'जो बच्चे दर्द नहीं बता सकते, उनका इलाज बीमारी की जगह "शैतानी" मानकर होता है। ज़रूरत पड़ने से पहले सिखाएँ।',
    moments: [
      'Model it on yourself with a headache, out loud',
      'Use it during a small scrape, then pair with the body part',
      'Practise PAIN + TUMMY, PAIN + TEETH while everyone is well',
      'Offer it at the doctor before being asked anything',
      'Take it seriously every single time',
    ],
    momentsHi: [
      'सिरदर्द होने पर खुद पर बोलकर दिखाएँ',
      'छोटी चोट लगने पर इस्तेमाल करें, फिर शरीर के अंग के साथ जोड़ें',
      'सब ठीक हों तब अभ्यास करें: "दर्द + पेट", "दर्द + दाँत"',
      'डॉक्टर के पास कुछ पूछे जाने से पहले दिखाएँ',
      'हर बार गंभीरता से लें',
    ],
  },
  {
    id: 'myturn',
    why: 'Gets a child into a game with other children instead of watching from the side.',
    whyHi: 'बच्चा किनारे बैठकर देखने की जगह दूसरे बच्चों के खेल में शामिल हो पाता है।',
    moments: [
      'Take obvious turns with a ball and narrate both',
      'Tap MY TURN for yourself so they see it is not only theirs',
      'Use it with siblings on the cycle',
      'Set up games that need turns: blocks, bubbles, drums',
      'Make sure the turn actually arrives immediately',
    ],
    momentsHi: [
      'गेंद से बारी-बारी खेलें और दोनों बारी बोलें',
      'खुद के लिए भी "मेरी बारी" दबाएँ',
      'साइकिल पर भाई-बहन के साथ इस्तेमाल करें',
      'बारी वाले खेल चुनें: ब्लॉक्स, बुलबुले, ढोल',
      'बारी तुरंत आनी चाहिए',
    ],
  },
];

/**
 * Which word this week lands on.
 *
 * Derived from the date so it moves on its own without anything stored, and
 * wraps round the list rather than ever running out.
 */
export function weekIndex(now: number, offset = 0): number {
  const weeks = Math.floor(now / (7 * 24 * 60 * 60 * 1000));
  return (((weeks + offset) % CORE_WEEK.length) + CORE_WEEK.length) % CORE_WEEK.length;
}
