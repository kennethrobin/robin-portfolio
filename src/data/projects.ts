/* ============================================================
   PROJECT DATA — the only file you need to touch to add,
   remove, or reorder work.

   Each project:
     slug      folder name under /public/media/<slug>/
     title     display title
     client    client name (shows in the index metadata column)
     year      string so "2020–21" etc. is fine  ← VERIFY THESE
     role      short role line, e.g. "Creative Direction, Design"
     blurb     1–2 sentences for the detail view
     media     images in display order; first one is the hero /
               thumbnail. Paths are relative to /public.
     video     OPTIONAL. Either a Vimeo embed URL (plays in an
               iframe on the detail page) or a local file like
               "/media/bmw/loop.mp4" (muted autoplay loop).
               Local .mp4 loops also replace the hero image as
               the moving thumbnail in the index — drop a file
               in and it upgrades automatically.
     tone      OPTIONAL hex used as the plane tint / placeholder
               while media loads. Defaults to near-black.

   Years below are best guesses from the old site — please fix.
   ============================================================ */

export interface Project {
  slug: string;
  title: string;
  client: string;
  year: string;
  role: string;
  blurb: string;
  media: string[];
  video?: string;
  tone?: string;
  /* OPTIONAL rich case study. When present, the modal renders a
     full studio-style page (looping lead film, long-form copy,
     image/grid/video blocks and a credits list) instead of the
     simple hero + blurb + stills layout. */
  study?: Study;
  /* OPTIONAL. Hide from the work index while keeping the data here
     so the page can be built out and re-enabled later. */
  hidden?: boolean;
}

/* A single credit line in the case-study footer, e.g.
   { role: 'Director', name: 'Kenneth Robin' }. */
export interface Credit { role: string; name: string; }

/* Ordered content blocks for a case study, rendered top-to-bottom
   under the lead film + intro copy.
     text       one or more paragraphs of running copy
     image      a single full-width still (optional caption)
     grid       a set of stills laid out in a responsive grid
     video      a muted, looping local .mp4 (optional caption).
                Set controls:true to let the viewer unmute/scrub.
     videogrid  a set of muted, looping local .mp4s in a grid
                (e.g. lower thirds / bumpers) */
export type StudyBlock =
  | { kind: 'text'; body: string[] }
  | { kind: 'image'; src: string; cap?: string; ratio?: string }
  | { kind: 'grid'; src: string[]; ratio?: string }
  | { kind: 'video'; src: string; cap?: string; controls?: boolean }
  | { kind: 'videogrid'; src: string[]; cap?: string; ratio?: string };

export interface Study {
  /* Looping local .mp4 shown first, full-bleed, on the detail page. */
  lead: string;
  /* When true, the local lead film shows native controls so the
     viewer can unmute / scrub (still autoplays muted + loops).
     Ignored for remote (Vimeo) leads, which use their own player. */
  leadControls?: boolean;
  /* Long-form, first-person intro paragraphs under the lead film. */
  intro: string[];
  /* Everything below the intro, in display order. */
  blocks: StudyBlock[];
  /* Credits list shown at the foot of the case study. */
  credits: Credit[];
}

const m = (slug: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => `/media/${slug}/${String(i + 1).padStart(2, '0')}.jpg`);

export const projects: Project[] = [
  {
    slug: 'att-discovery-district',
    title: 'AT&T Discovery District',
    client: 'AT&T',
    year: '2021',
    role: 'Creative Direction, Design',
    blurb:
      'Experiential content for the large-format media wall at AT&T’s headquarters in Dallas, where people gather to watch games and spend time in the outdoor plaza. As one of the first artists commissioned for the screen, I designed a world of bioluminescent deep-sea species — a celebration of diversity. I developed the look through extensive animation and material tests, then built each creature, rigged and hand-detailed inside and out, to reward a close look at every layer. Experience design — motion as part of a place, not just a screen.',
    media: m('att-discovery-district', 5),
    video: 'https://player.vimeo.com/video/533794229',
    tone: '#0a1a2e',
    study: {
      lead: '/media/att-discovery-district/case/hero.mp4',
      intro: [
        'Gensler approached me to create a bumper for the media wall at AT&T’s Discovery District — the public plaza at the heart of AT&T’s headquarters in downtown Dallas, where people gather under a 104-foot screen to watch games, catch events, and spend time outdoors. I worked directly with Gensler and AT&T, following their brand guidelines and color system while we shaped the concept together.',
        'As one of the first artists commissioned for the wall, I designed a world of bioluminescent deep-sea creatures — a piece about diversity, the idea that the strangest, most singular forms of life thrive side by side in the same dark water. The brief was open; the responsibility was to make something that belonged to the place and rewarded the people standing beneath it.',
        'I directed the look from concept through final delivery, developing the language through extensive animation and material tests before committing to the build. Each creature was modeled, rigged, and hand-detailed inside and out — translucent skin, internal light, fine surface texture — so the work holds up at architectural scale, where a single organism drifts four stories tall across the plaza.',
        'This is the kind of work I care about most: motion as part of a place, not just a screen — content designed for the room it lives in and the people who gather there.',
      ],
      blocks: [
        { kind: 'image', src: '/media/att-discovery-district/case/styleframe.jpg', cap: 'Key styleframe — the bioluminescent palette and creature language set against AT&T’s brand color system.' },
        { kind: 'grid', src: [
          '/media/att-discovery-district/case/creature-01.jpg',
          '/media/att-discovery-district/case/creature-02.jpg',
          '/media/att-discovery-district/case/creature-03.jpg',
          '/media/att-discovery-district/case/creature-04.jpg',
          '/media/att-discovery-district/case/creature-05.jpg',
          '/media/att-discovery-district/case/creature-06.jpg',
          '/media/att-discovery-district/case/creature-07.png',
        ] },
        { kind: 'video', src: '/media/att-discovery-district/case/bts.mp4', cap: 'Behind the scenes — material, lighting and animation tests developed to define the look.' },
        { kind: 'image', src: '/media/att-discovery-district/case/still.jpg' },
      ],
      credits: [
        { role: 'Director', name: 'Kenneth Robin' },
        { role: 'Creative Director', name: 'Roger Ferris' },
        { role: 'Design Partner', name: 'Gensler' },
        { role: 'Client', name: 'AT&T' },
      ],
    },
  },
  {
    slug: 'bbc-two',
    title: 'BBC Two Rebrand',
    client: 'BBC',
    year: '2018',
    role: 'Design, Animation',
    blurb:
      'One of sixteen launch idents for BBC Two’s first rebrand in 20 years — my own interpretation of the channel’s iconic “2” as a living, visceral material study in motion.',
    media: m('bbc-two', 1),
    video: 'https://player.vimeo.com/video/480136521',
    tone: '#1a0a12',
    study: {
      lead: 'https://player.vimeo.com/video/480136521',
      intro: [
        'In 2018 BBC Two unveiled its first new identity in twenty years, retiring two decades of “2” idents for a single unifying idea: the curve of the numeral, reimagined as a new family of channel idents. I was commissioned to design and animate one of the launch idents.',
        'My brief was to take that iconic curve and make it my own: a short, self-contained world that reads instantly as BBC Two while standing entirely on its own. I designed and animated it as a visceral material study — treating the “2” as something alive, tactile and organic rather than graphic, with surface and light doing the work.',
        'The idents were built to be iterative — refreshed and expanded over time — and tied together by an evolving two-note sound signature. The work rolled out across broadcast and digital from the September 2018 launch.',
      ],
      blocks: [],
      credits: [
        { role: 'Design & Animation', name: 'Kenneth Robin' },
        { role: 'Agencies', name: 'BBC Creative & Superunion' },
        { role: 'Sound Design', name: 'Alex Baranowski' },
        { role: 'Brand', name: 'BBC Two' },
      ],
    },
  },
  {
    slug: 'hulu-in-bloom',
    title: 'Hulu in Bloom',
    client: 'Hulu',
    year: '2024',
    role: 'VFX Supervision, Design & Animation',
    blurb:
      'Hulu’s 2024 Black History Month campaign for its “Black Stories Always” platform — set VFX supervision and the design and animation of the blooming graphic elements, shot on the Disney lot.',
    media: ['/media/hulu-in-bloom/case/thumb.jpg'],
    tone: '#0f1a12',
    study: {
      lead: '/media/hulu-in-bloom/case/loop.mp4',
      intro: [
        'Hulu brought me on to help create its 2024 Black History Month campaign for the “Black Stories Always” platform — a celebration built on a simple, resonant idea: like flowers, Black stories are ever-present, always growing, always in bloom. The work ran across Hulu and the wider Disney bundle through February, anchoring the streamer’s year-round commitment to Black storytelling.',
        'I worked as set VFX supervisor and led the design and animation of the campaign’s graphic language — the blooming florals, lower thirds and logo treatments that hold the package together. On set I supervised the VFX so the practical photography and the animated elements would marry cleanly in post, then carried that look through into the finished motion design.',
        'It was shot on Stage 1 — the smaller infinity stage on the Disney lot — which gave us a clean, fully controllable environment to build the world around the talent. A genuinely fun collaboration, and a meaningful one to be part of.',
      ],
      blocks: [
        { kind: 'video', src: '/media/hulu-in-bloom/case/hero.mp4', controls: true, cap: 'The hero film.' },
        { kind: 'text', body: ['Behind the scenes on Stage 1 — the smaller infinity stage on the Disney lot.'] },
        { kind: 'image', src: '/media/hulu-in-bloom/case/bts-05.jpg', ratio: '16 / 9' },
        { kind: 'grid', ratio: '16 / 9', src: [
          '/media/hulu-in-bloom/case/bts-01.jpg',
          '/media/hulu-in-bloom/case/bts-02.jpg',
          '/media/hulu-in-bloom/case/bts-03.jpg',
          '/media/hulu-in-bloom/case/bts-04.jpg',
        ] },
        { kind: 'videogrid', cap: 'Lower thirds, bumpers and logo animations from the campaign package.', src: [
          '/media/hulu-in-bloom/case/lower-01.mp4',
          '/media/hulu-in-bloom/case/lower-02.mp4',
          '/media/hulu-in-bloom/case/lower-03.mp4',
          '/media/hulu-in-bloom/case/lower-04.mp4',
        ] },
      ],
      credits: [
        { role: 'VFX Supervision, Design & Animation', name: 'Kenneth Robin' },
        { role: 'Director', name: 'Steven Mosley' },
        { role: 'Production', name: 'HollandWest Productions' },
        { role: 'Client', name: 'Hulu — Black Stories Always' },
      ],
    },
  },
  {
    slug: 'hip-hop-uncovered',
    title: 'Hip Hop Uncovered',
    client: 'FX',
    year: '2021',
    role: 'Broadcast Design, Animation',
    blurb:
      'On-air graphics and title package for FX’s six-part docuseries on hip hop’s behind-the-scenes power brokers — a raw, type-driven motion system of IDs, era stamps, city locators and lyric cards.',
    media: ['/media/hip-hop-uncovered/case/still-hero.webp'],
    tone: '#140a0a',
    study: {
      lead: '/media/hip-hop-uncovered/case/hero.mp4',
      leadControls: true,
      intro: [
        'Hip Hop Uncovered is FX’s six-part documentary series that tells the story of hip hop from the streets up — following five of the behind-the-scenes power brokers who shaped the culture across 40 years of music history. I designed and animated the show’s on-air graphics package: the title treatment and the system of cards that carry the storytelling through all six episodes — era and date stamps, city locators, and on-screen lyric callouts.',
        'The look had to feel like the culture it was documenting — raw, bold and unmistakably built from the street up rather than polished from the top down. I developed a type-driven motion language that could cut hard against decades of archival footage, photographs and interviews without ever softening the edge.',
        'The package threaded the series’ three layers — the people, the music, and the America around them — into a single visual voice that ran across every episode on FX and Hulu.',
      ],
      blocks: [
        { kind: 'video', src: '/media/hip-hop-uncovered/case/reel.mp4', controls: true, cap: 'Highlight reel.' },
        { kind: 'image', src: '/media/hip-hop-uncovered/case/still-hero.webp', ratio: '16 / 9' },
        { kind: 'grid', ratio: '16 / 9', src: [
          '/media/hip-hop-uncovered/case/still-01.webp',
          '/media/hip-hop-uncovered/case/still-02.webp',
          '/media/hip-hop-uncovered/case/still-03.webp',
          '/media/hip-hop-uncovered/case/still-04.webp',
          '/media/hip-hop-uncovered/case/still-05.webp',
          '/media/hip-hop-uncovered/case/still-06.webp',
          '/media/hip-hop-uncovered/case/still-07.jpg',
          '/media/hip-hop-uncovered/case/still-08.webp',
          '/media/hip-hop-uncovered/case/still-09.webp',
          '/media/hip-hop-uncovered/case/still-10.webp',
          '/media/hip-hop-uncovered/case/still-11.webp',
          '/media/hip-hop-uncovered/case/still-12.webp',
        ] },
      ],
      credits: [
        { role: 'Broadcast Design & Animation', name: 'Kenneth Robin' },
        { role: 'Client', name: 'FX Networks' },
      ],
    },
  },
  {
    slug: 'aiga-revival',
    title: 'AIGA Revival',
    client: 'AIGA',
    year: '2015',
    role: 'Direction, Design, Animation',
    blurb:
      'Title films for the 2015 AIGA Design Conference in New Orleans — my hometown. Through IAAH, I directed, designed and animated the main film and the speaker bumpers for a conference themed on the city’s revival.',
    media: ['/media/aiga-revival/case/thumb.png'],
    tone: '#160a10',
    study: {
      lead: '/media/aiga-revival/case/hero.mp4',
      leadControls: true,
      intro: [
        '“Revival” was the theme of the 2015 AIGA Design Conference, held in New Orleans — my hometown. Chosen to mark ten years since Hurricane Katrina, it spoke to rebirth, regrowth and rebuilding: honoring the city’s past while looking to its future. Through IAAH (iamalwayshungry), I directed, designed and animated the conference’s title films — the main film and the speaker bumpers that opened the stage for every guest.',
        'We built the look around the iconography of New Orleans — lush florals, brass, and the spirit of a second line — shooting in the city itself and weaving the conference’s hand-built typeface and visual system into a living, celebratory open.',
        'For me it was personal: my city telling its own story of revival. The films played to thousands of designers and many of the field’s most influential voices — Michael Bierut, Roman Mars, Karin Fong and dozens more — as the bumpers introduced each of them to the stage.',
      ],
      blocks: [
        { kind: 'videogrid', ratio: '16 / 9', cap: 'Speaker bumpers — an opening film for each conference guest.', src: [
          '/media/aiga-revival/case/bumper-01.mp4',
          '/media/aiga-revival/case/bumper-02.mp4',
          '/media/aiga-revival/case/bumper-03.mp4',
          '/media/aiga-revival/case/bumper-04.mp4',
          '/media/aiga-revival/case/bumper-05.mp4',
          '/media/aiga-revival/case/bumper-06.mp4',
          '/media/aiga-revival/case/bumper-07.mp4',
          '/media/aiga-revival/case/bumper-08.mp4',
          '/media/aiga-revival/case/bumper-09.mp4',
          '/media/aiga-revival/case/bumper-10.mp4',
        ] },
        { kind: 'video', src: '/media/aiga-revival/case/trombone.mp4', controls: true, cap: 'Trombone interlude.' },
        { kind: 'video', src: '/media/aiga-revival/case/credits.mp4', controls: true, cap: 'Closing credit roll.' },
      ],
      credits: [
        { role: 'Director, Design & Animation', name: 'Kenneth Robin' },
        { role: 'Studio', name: 'IAAH (iamalwayshungry)' },
        { role: 'Creative Direction', name: 'Nessim Higson' },
        { role: 'Art Direction', name: 'Taylor Bourdeaux' },
        { role: 'Design & Typeface', name: 'Brandon Washington' },
        { role: 'Animation', name: 'Joe Fleming' },
        { role: 'Director of Photography', name: 'Mike Kennedy' },
        { role: 'Sound Design', name: 'Joe Johnson & Linton Smith' },
        { role: 'Client', name: 'AIGA' },
      ],
    },
  },
  {
    slug: 'cybrpnk',
    title: 'CYBRPNK',
    client: 'Personal',
    year: '2023',
    role: 'Direction, CG',
    blurb:
      'A self-initiated character and world-building study — chrome, neon and worn futures rendered as a series of stills and motion tests.',
    media: m('cybrpnk', 5),
    tone: '#101421',
    hidden: true,
  },
  {
    slug: 'bmw',
    title: 'Vision Rooms',
    client: 'BMW',
    year: '2018',
    role: 'Design, CG',
    blurb:
      'Spatial design frames for a BMW brand experience — light-driven rooms exploring the future of the marque.',
    media: m('bmw', 4),
    tone: '#0c111a',
    hidden: true,
  },
  {
    slug: 'falling-waters',
    title: 'Falling Waters',
    client: 'NYC',
    year: '2020',
    role: 'Direction, CG',
    blurb:
      'Water suspended over Manhattan — a CG short exploring scale and weightlessness in a familiar skyline.',
    media: m('falling-waters', 5),
    tone: '#0e1418',
    hidden: true,
  },
  {
    slug: 'faraday',
    title: 'CES Reveal',
    client: 'Faraday Future',
    year: '2016',
    role: 'Design, Animation',
    blurb:
      'Launch-film design for Faraday Future at CES — exploded views, battery reveals and data-car visualizations.',
    media: m('faraday', 4),
    tone: '#0a0f14',
    hidden: true,
  },
  {
    slug: 'spotify-yim',
    title: 'Year in Music',
    client: 'Spotify',
    year: '2015',
    role: 'Design, Animation',
    blurb:
      'Campaign design for Spotify’s Year in Music — typographic systems built around the year’s defining artists.',
    media: m('spotify-yim', 4),
    tone: '#160a18',
    hidden: true,
  },
  {
    slug: 'xbox-what-if',
    title: 'What If',
    client: 'Xbox',
    year: '2014',
    role: 'Design, CG',
    blurb:
      'Concept design for Xbox — album-art worlds and console cutaways imagining the machine from the inside out.',
    media: m('xbox-what-if', 4),
    tone: '#0a1410',
    hidden: true,
  },
  {
    slug: 'air-jordan-xxxi',
    title: 'Air Jordan XXXI',
    client: 'Jordan Brand',
    year: '2017',
    role: 'CG, Animation',
    blurb:
      'Product-film renders for the Air Jordan XXXI — studio light studies on a familiar silhouette.',
    media: m('air-jordan-xxxi', 2),
    tone: '#140c0a',
    hidden: true,
  },
  {
    slug: 'squarespace',
    title: 'Hip Hop Project',
    client: 'Squarespace',
    year: '2016',
    role: 'Design, Animation',
    blurb:
      'Brand-film design for Squarespace’s Hip Hop Project campaign.',
    media: m('squarespace', 1),
    video: 'https://player.vimeo.com/video/154650574',
    tone: '#0d0d10',
    hidden: true,
  },
];

/* ---- Site-wide copy — edit freely ------------------------- */
export const site = {
  name: 'Kenneth Robin',
  statement: 'Creative direction & design for motion.',
  sub: 'Los Angeles',
  email: 'hello@kennethrobin.la',
  // Names only — keep this ruthlessly true. Add a name only once it's confirmed.
  clients: 'BMW · BBC · Al Jazeera · Xbox · Squarespace · AT&T · Hulu · Faraday · M83 · FootJoy · Dodge · Samsung · AIGA',
  about:
    'Hey — I’m Kenneth, a director and designer in LA. I’ve spent 15+ years making motion for brands that actually want to say something: broadcast identities, title sequences, 3D, and big installations you can stand under. AT&T, BBC, Hulu, FX, Xbox — a few of the names along the way. One frame or a whole campaign, I sweat it the same. And if the technique doesn’t exist yet, I’ll go build it.',
};

/* ---- Labs — experimental / self-initiated work --------------
   Opened from the top nav as a modal (like a project page). A
   2-column column-masonry of mixed media; .mp4 entries play as
   muted loops, everything else renders as an image. All items are
   shuffled fresh on each open. Add/remove paths in public/media/labs/. */
export const labs = {
  title: 'Labs',
  blurb:
    'A running dump of experiments, tests and self-initiated work — techniques I’m developing and ideas I chase outside of client projects. Rough by design, and updated often.',
  items: [
    '/media/labs/labs-01.jpg',
    '/media/labs/labs-02.png',
    '/media/labs/labs-28.mp4',   // windtunnel_test
    '/media/labs/labs-17.mp4',   // k_tear
    '/media/labs/labs-03.png',
    '/media/labs/labs-04.png',
    '/media/labs/labs-05.jpg',
    '/media/labs/labs-06.webp',
    '/media/labs/labs-07.webp',
    '/media/labs/labs-09.jpg',
    '/media/labs/labs-10.webp',
    '/media/labs/labs-11.webp',
    '/media/labs/labs-12.webp',
    '/media/labs/labs-13.webp',
    '/media/labs/labs-14.jpg',
    '/media/labs/labs-15.jpg',
    '/media/labs/labs-16.webp',
    '/media/labs/labs-18.webp',
    '/media/labs/labs-19.webp',
    '/media/labs/labs-20.jpg',
    '/media/labs/labs-21.png',
    '/media/labs/labs-22.jpg',
    '/media/labs/labs-23.jpg',
    '/media/labs/labs-24.png',
    '/media/labs/labs-25.jpg',
    '/media/labs/labs-29.webp',
    '/media/labs/labs-30.mp4',
  ],
};
