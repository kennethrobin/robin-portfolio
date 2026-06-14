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
      'Large-format motion pieces for the AT&T Discovery District in downtown Dallas — fluid, sculptural forms built for a 104-foot media wall.',
    media: m('att-discovery-district', 5),
    video: 'https://player.vimeo.com/video/533794229',
    tone: '#0a1a2e',
  },
  {
    slug: 'bbc-two',
    title: 'Two — Visceral',
    client: 'BBC',
    year: '2020',
    role: 'Design, Animation',
    blurb:
      'Ident concept for the BBC Two rebrand — the "2" as a living, visceral material study in motion.',
    media: m('bbc-two', 1),
    video: 'https://player.vimeo.com/video/480136521',
    tone: '#1a0a12',
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
  clients: 'BMW · BBC · Al Jazeera · Xbox · Squarespace · Spotify · AT&T · Jordan Brand · Faraday',
  about:
    'Kenneth Robin is a creative director and motion designer in Los Angeles. He directs and designs film, brand and spatial work for clients across automotive, broadcast, music and technology.',
};
