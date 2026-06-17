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
}

/* A single credit line in the case-study footer, e.g.
   { role: 'Director', name: 'Kenneth Robin' }. */
export interface Credit { role: string; name: string; }

/* Ordered content blocks for a case study, rendered top-to-bottom
   under the lead film + intro copy.
     text   one or more paragraphs of running copy
     image  a single full-width still (optional caption)
     grid   a set of stills laid out in a responsive grid
     video  a muted, looping local .mp4 (optional caption) */
export type StudyBlock =
  | { kind: 'text'; body: string[] }
  | { kind: 'image'; src: string; cap?: string }
  | { kind: 'grid'; src: string[] }
  | { kind: 'video'; src: string; cap?: string };

export interface Study {
  /* Looping local .mp4 shown first, full-bleed, on the detail page. */
  lead: string;
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
    title: 'Discovery District',
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
    year: '2020',
    role: 'Design, Animation',
    blurb:
      'Ident concept for the BBC Two rebrand — the "2" as a living, visceral material study in motion.',
    media: m('bbc-two', 1),
    video: 'https://player.vimeo.com/video/480136521',
    tone: '#1a0a12',
    study: {
      lead: 'https://player.vimeo.com/video/480136521',
      intro: [
        'The BBC Two “2” has always been a playground for designers — a mark made to be reimagined as an object, a creature, a material. For this rebrand concept I wanted to treat the numeral as something alive and visceral: a form that breathes, tenses and reacts, built from a material that feels organic rather than graphic.',
        'I developed the idea through a run of material and motion studies — exploring surface, translucency and the way light moves across and through the “2” as it shifts. The aim was an ident that reads less like a logo animation and more like a living thing caught on screen for a few seconds.',
        'Everything was designed, modeled and animated to hold up at broadcast scale, where the mark has to land with presence in just a beat or two — distinct, tactile, and unmistakably Two.',
      ],
      blocks: [],
      credits: [
        { role: 'Concept, Design & Animation', name: 'Kenneth Robin' },
        { role: 'Brand', name: 'BBC Two' },
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
    'Kenneth Robin is a creative director and motion designer based in Los Angeles, working across film, broadcast design, 3D, and large-scale experiences. I bring a strong point of view and the craft to back it — concepting ambitious work and, when it doesn’t exist yet, inventing the technique to make it real. For over a decade I’ve made that work for global brands and artists who’d rather do something singular than something safe.',
};
