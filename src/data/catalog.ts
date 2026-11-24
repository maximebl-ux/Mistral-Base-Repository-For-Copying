import type { Episode, Film, Series, Video } from "@/types";

const GTV = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample";

export const SAMPLE_VIDEOS = {
  bunny: `${GTV}/BigBuckBunny.mp4`,
  sintel: `${GTV}/Sintel.mp4`,
  tears: `${GTV}/TearsOfSteel.mp4`,
  dream: `${GTV}/ElephantsDream.mp4`,
  blazes: `${GTV}/ForBiggerBlazes.mp4`,
  escapes: `${GTV}/ForBiggerEscapes.mp4`,
  fun: `${GTV}/ForBiggerFun.mp4`,
  joy: `${GTV}/ForBiggerJoyrides.mp4`,
};

export const GENRES = ["Action", "Adventure", "Animation", "Comedy", "Crime", "Documentary", "Drama", "Fantasy", "Mystery", "Romance", "Sci-Fi", "Thriller"] as const;

export const channels = [
  { id: "ch-nova", name: "Nova Fieldcraft", description: "Practical filmmaking, lighting experiments and behind-the-scenes technique from a small documentary crew.", posterPalette: 0, subscribers: 1240000, verified: true },
  { id: "ch-atlas", name: "Atlas Open Cinema", description: "Commentary and essays on the Blender open movies and the free-culture archive.", posterPalette: 3, subscribers: 842000, verified: true },
  { id: "ch-harbour", name: "Harbour Street Kitchen", description: "One recipe, one story, one take. Slow television from a working kitchen on the north pier.", posterPalette: 3, subscribers: 655000, verified: false },
] as const;

interface FilmSpec {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genres: string[];
  year: number;
  rating: number;
  maturity: Film["maturity"];
  durationMin: number;
  views: number;
  publishedAt: string;
  posterPalette: number;
  featured?: boolean;
  director: string;
  cast: string[];
  videoUrl?: string;
}

const filmSpecs: FilmSpec[] = [
  { id: "film-aurora-bloom", title: "Aurora Bloom", tagline: "The last garden is orbital.", description: "In 2049, a botanist tends Earth's final seed vault in low orbit while the surface cools. A patient, spectral science-fiction drama.", genres: ["Sci-Fi", "Drama"], year: 2025, rating: 8.4, maturity: "PG-13", durationMin: 0, views: 4820000, publishedAt: "2025-01-14", posterPalette: 0, featured: true, director: "Ilse Vandermeer", cast: ["Noa Petranek"], videoUrl: SAMPLE_VIDEOS.sintel },
  { id: "film-meridian-drift", title: "Meridian Drift", tagline: "The job was simple. The cargo was not.", description: "A long-haul courier takes one last contract through frozen interior highways and discovers her cargo is a person who cannot go back.", genres: ["Thriller", "Drama"], year: 2024, rating: 8.4, maturity: "PG-13", durationMin: 0, views: 3110000, publishedAt: "2024-09-03", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Ingrid Kalda", "Tomas Weber"], videoUrl: SAMPLE_VIDEOS.sintel },
  { id: "film-paper-lions", title: "Paper Lions", tagline: "Legacies are printed, not born.", description: "Three generations of a newspaper family fight over its final print run while the youngest heir sells the story of their collapse in real time.", genres: ["Drama"], year: 2022, rating: 8.1, maturity: "PG-13", durationMin: 0, views: 1120000, publishedAt: "2022-03-18", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Ingrid Kalda", "Tomas Weber"], videoUrl: SAMPLE_VIDEOS.sintel },
  { id: "film-glasshouse-sessions", title: "The Glasshouse Sessions", tagline: "Recorded where you can see everything.", description: "Five musicians, one decommissioned botanical greenhouse, and a single take per song. A concert documentary about isolation, resonance and glass.", genres: ["Documentary", "Drama"], year: 2023, rating: 7.8, maturity: "PG-13", durationMin: 0, views: 620000, publishedAt: "2023-05-25", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Marthe Vliegen"], videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "film-northbound", title: "Northbound", tagline: "The cold keeps honest company.", description: "A teenage musher and her grandfather's lead dog cross four hundred kilometres of tundra to reach a hospital before the storm season closes the pass.", genres: ["Adventure", "Mystery"], year: 2024, rating: 7.6, maturity: "PG", durationMin: 0, views: 890000, publishedAt: "2024-12-05", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Siri Halvorsen"], videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "film-last-train-aurora", title: "The Last Train to Aurora", tagline: "Some farewells take four hundred kilometres.", description: "Strangers share a sleeper carriage the night before the northern line closes for good. By morning, one of them will be someone else entirely.", genres: ["Romance", "Drama"], year: 2021, rating: 8.3, maturity: "PG-13", durationMin: 0, views: 1980000, publishedAt: "2021-11-12", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Noa Petranek"], videoUrl: undefined },
  { id: "film-cartographers", title: "The Cartographers", tagline: "The map is watching back.", description: "In a kingdom where geography is law, a surveyor finds a valley that appears on no chart — and the royal ink is willing to burn a province to keep it that way.", genres: ["Fantasy", "Adventure"], year: 2022, rating: 8.0, maturity: "PG", durationMin: 0, views: 2410000, publishedAt: "2022-08-30", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Ingrid Kalda", "Tomas Weber"], videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "film-noir-province", title: "Noir Province", tagline: "Everyone in this town is twelve people.", description: "In a mining town with eleven bars and one doctors' surgery, a visiting inspector has one weekend to find out who is poisoning the water — and who is paying them not to say so.", genres: ["Thriller", "Crime"], year: 2023, rating: 8.5, maturity: "R", durationMin: 0, views: 1560000, publishedAt: "2023-10-06", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Ingrid Kalda", "Tomas Weber"], videoUrl: SAMPLE_VIDEOS.blazes },
  { id: "film-half-a-mile-of-july", title: "Half a Mile of July", tagline: "The worst summer of their lives, in one block.", description: "Five kids, one cul-de-sac, one heatwave and the last working lawn mower in the postcode. A comedy about the economics of boredom.", genres: ["Comedy", "Family"], year: 2024, rating: 7.2, maturity: "PG", durationMin: 0, views: 530000, publishedAt: "2024-07-19", posterPalette: 3, director: "Ilse Vandermeer", cast: ["Siri Halvorsen"], videoUrl: SAMPLE_VIDEOS.fun },
  { id: "film-big-buck-bunny", title: "Big Buck Bunny", tagline: "Payback is a big bunny.", description: "Blender Foundation's landmark open movie: a gentle giant rabbit with a grudge, three rodents and an elaborate revenge, told wordlessly in lush computer animation. Freely licensed under Creative Commons.", genres: ["Animation", "Comedy", "Family"], year: 2008, rating: 7.7, maturity: "G", durationMin: 10, views: 5210000, publishedAt: "2008-04-10", posterPalette: 3, director: "Sacha Goedegebure", cast: ["Big Buck Bunny"], videoUrl: SAMPLE_VIDEOS.bunny },
  { id: "film-sintel", title: "Sintel", tagline: "A lone hunter. A wounded dragon. A promise kept at any cost.", description: "Blender Foundation's epic fantasy short: a young woman crosses a hostile world in search of the dragon she once nursed back to flight. Note: this is the freely licensed open movie, credited to the Blender Foundation.", genres: ["Fantasy", "Adventure", "Drama"], year: 2010, rating: 8.1, maturity: "PG-13", durationMin: 15, views: 6400000, publishedAt: "2010-09-27", posterPalette: 3, director: "Colin Levy", cast: ["Halina Reijn", "Thom Hoffman"], videoUrl: SAMPLE_VIDEOS.sintel },
];

export const films: Film[] = filmSpecs.map((spec) => ({
  id: spec.id,
  kind: "film",
  title: spec.title,
  tagline: spec.tagline,
  description: spec.description,
  genres: spec.genres,
  year: spec.year,
  rating: spec.rating,
  maturity: spec.maturity,
  durationMin: spec.durationMin,
  views: spec.views,
  publishedAt: spec.publishedAt,
  posterPalette: spec.posterPalette,
  featured: spec.featured,
  director: spec.director,
  cast: spec.cast,
  videoUrl: spec.videoUrl,
}));

interface EpisodeSpec {
  title: string;
  description: string;
  season: number;
  number: number;
  durationMin: number;
  videoUrl: string;
}

interface SeriesSpec {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genres: string[];
  year: number;
  rating: number;
  maturity: Film["maturity"];
  durationMin: number;
  views: number;
  publishedAt: string;
  posterPalette: number;
  featured?: boolean;
  seasons: { season: number; title: string; year: number; episodes: EpisodeSpec[] }[];
}

const seriesSpecs: SeriesSpec[] = [
  {
    id: "ser-aurora-division",
    title: "Aurora Division",
    tagline: "The night shift guards the sky.",
    description: "At a polar research station turned emergency command post, a skeleton crew tracks satellites that have started filing reports about Earth.",
    genres: ["Sci-Fi", "Thriller"],
    year: 2024,
    rating: 8.7,
    maturity: "TV-14",
    durationMin: 0,
    views: 2980000,
    publishedAt: "2024-11-08",
    posterPalette: 0,
    featured: true,
    seasons: [
      {
        season: 1,
        title: "Season 1",
        year: 2024,
        episodes: [
          { title: "Long Dark", description: "Six weeks into the polar night, Aurora Division's rooftop array starts returning something impossible: telemetry from 1976, answered.", season: 1, number: 1, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "Signal Debt", description: "Commander Reyes must decide who to tell when the signals begin answering questions no one transmitted.", season: 1, number: 2, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "Ice Nine", description: "A supply plane arrives with one extra passenger and no flight plan.", season: 1, number: 3, durationMin: 0, videoUrl: SAMPLE_VIDEOS.blazes },
          { title: "The Committee Sleeps", description: "The crew votes. The sky objects. Everything on the long dark depends on who keeps the watch.", season: 1, number: 4, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "Dawn Watch", description: "Spring arrives at the station, and with it the first relief crew — and the first outsiders to read the archive.", season: 1, number: 5, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "Aurora", description: "The division's longest night ends on its own terms, and its members scatter with what they know.", season: 1, number: 6, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
        ],
      },
      {
        season: 2,
        title: "Season 2",
        year: 2025,
        episodes: [
          { title: "Second Echo", description: "Spring arrives at the station, and with it the first relief crew — and the first outsiders to read the archive.", season: 2, number: 1, durationMin: 0, videoUrl: SAMPLE_VIDEOS.blazes },
          { title: "Termination Latency", description: "Reyes negotiates with a committee that has never met in the same room, or the same year.", season: 2, number: 2, durationMin: 0, videoUrl: SAMPLE_VIDEOS.blazes },
          { title: "First Light", description: "The division's longest night ends on its own terms, and its members scatter with what they know.", season: 2, number: 3, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
        ],
      },
    ],
  },
  {
    id: "ser-quiet-coast",
    title: "The Quiet Coast",
    tagline: "Everyone here has a reason to stay silent.",
    description: "A detective returns to her hometown to close a cold case and finds that the whole village has spent twenty years agreeing on the same lie.",
    genres: ["Mystery", "Drama"],
    year: 2024,
    rating: 8.9,
    maturity: "TV-MA",
    durationMin: 0,
    views: 3640000,
    publishedAt: "2024-10-02",
    posterPalette: 3,
    featured: true,
    seasons: [
      {
        season: 1,
        title: "Season 1",
        year: 2024,
        episodes: [
          { title: "The Returning", description: "Detective Maren Hall returns to Vessing for a funeral and is handed a file that should have been closed decades ago.", season: 1, number: 1, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
        ],
      },
    ],
  },
  {
    id: "ser-mothkeepers",
    title: "The Mothkeepers",
    tagline: "They tend the light that shouldn't exist.",
    description: "In a valley where dusk lasts eleven hours, a hereditary order guards lamps that keep something older than language asleep.",
    genres: ["Fantasy", "Drama"],
    year: 2024,
    rating: 8.2,
    maturity: "TV-14",
    durationMin: 0,
    views: 1710000,
    publishedAt: "2024-03-29",
    posterPalette: 3,
    seasons: [
      {
        season: 1,
        title: "Season 1",
        year: 2024,
        episodes: [
          { title: "Wick", description: "Wren inherits her grandmother's lamp, its ledger of debts, and a key for a door the valley insists doesn't exist.", season: 1, number: 1, durationMin: 0, videoUrl: SAMPLE_VIDEOS.blazes },
          { title: "The Vigil", description: "A tourist's drone photographs what the lamps are for.", season: 1, number: 2, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "Oil and Ash", description: "The order's council meets for the first time in a decade, and trusts each other less than the dark.", season: 1, number: 3, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "Duskfall", description: "With dusk at full length, the lamps begin to fail in sequence, exactly as the ledger predicted.", season: 1, number: 4, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
          { title: "The Eleventh Hour", description: "Wren traces the ledger to the valley's founders — and to a page that has been torn from every copy.", season: 1, number: 5, durationMin: 0, videoUrl: SAMPLE_VIDEOS.blazes },
          { title: "Morning (Provisional)", description: "A new keeper is chosen, and the valley wakes to find dusk slightly shorter.", season: 1, number: 6, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
        ],
      },
    ],
  },
  {
    id: "ser-brightwater",
    title: "Brightwater",
    tagline: "The river runs through everyone's books.",
    description: "A forensic accountant is parachuted into a port city's flagship regeneration project and finds that the money, like the river, has been redirected everywhere at once.",
    genres: ["Crime", "Drama"],
    year: 2023,
    rating: 8.5,
    maturity: "TV-MA",
    durationMin: 0,
    views: 2440000,
    publishedAt: "2023-02-16",
    posterPalette: 3,
    seasons: [
      {
        season: 1,
        title: "Season 1",
        year: 2023,
        episodes: [
          { title: "Regeneration", description: "Auditor Ife Adeyemi arrives to certify Brightwater's books and is told, politely, that no one ever has.", season: 1, number: 1, durationMin: 0, videoUrl: SAMPLE_VIDEOS.escapes },
        ],
      },
      {
        season: 2,
        title: "Season 2",
        year: 2024,
        episodes: [
          { title: "New Rails", description: "A new mayor, a new ledger, and a witness who insists on testifying in verse.", season: 2, number: 1, durationMin: 0, videoUrl: SAMPLE_VIDEOS.blazes },
        ],
      },
    ],
  },
];

function base(spec: SeriesSpec) {
  return {
    id: spec.id,
    kind: "series" as const,
    title: spec.title,
    tagline: spec.tagline,
    description: spec.description,
    genres: spec.genres,
    year: spec.year,
    rating: spec.rating,
    maturity: spec.maturity,
    durationMin: spec.durationMin,
    views: spec.views,
    publishedAt: spec.publishedAt,
    posterPalette: spec.posterPalette,
    featured: spec.featured,
  };
}

export const series: Series[] = seriesSpecs.map((spec) => ({
  ...base(spec),
  seasons: spec.seasons.map((se) => ({
    season: se.season,
    title: se.title,
    year: se.year,
    episodes: se.episodes.map((ep, i) => ({
      id: `${spec.id}-s${se.season}e${i + 1}`,
      seriesId: spec.id,
      title: ep.title,
      description: ep.description,
      season: se.season,
      number: ep.number,
      durationMin: ep.durationMin,
      videoUrl: ep.videoUrl,
      posterPalette: (spec.posterPalette + i) % 12,
    })),
  })),
}));

export const episodes: Episode[] = series.flatMap((s) => s.seasons.flatMap((se) => se.episodes));

export const videos: Video[] = [
  { id: "vid-natural-light", kind: "video", title: "Shooting in Natural Light", tagline: "Window light is a free crew member.", description: "A practical walkthrough of shooting documentary interviews with nothing but window light, a bounce card and accepted chaos.", genres: ["Documentary"], year: 2025, rating: 4.8, maturity: "G", durationMin: 12, views: 184000, publishedAt: "2025-06-02", posterPalette: 3, channelId: "ch-nova", status: "published", visibility: "public", categories: ["Lighting", "Documentary"], transcriptReady: true, videoUrl: SAMPLE_VIDEOS.blazes },
  { id: "vid-sound-quiet-rooms", kind: "video", title: "Sound for Quiet Rooms", tagline: "Clean dialogue starts with the room.", description: "Recording clean dialogue on a budget: boom versus lav, room tone, and the radiator that ruined a perfect take.", genres: ["Documentary", "Tutorial"], year: 2025, rating: 4.6, maturity: "G", durationMin: 9, views: 42000, publishedAt: "2025-06-25", posterPalette: 3, channelId: "ch-nova", status: "published", visibility: "public", categories: ["Sound", "Documentary"], transcriptReady: true, videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "vid-natural-light-ii", kind: "video", title: "Natural Light II: The Director's Cut", tagline: "The uncut session, warts and all.", description: "The 40-minute uncut version of the natural-light session, including every reshoot and the argument about nets.", genres: ["Documentary", "Tutorial"], year: 2025, rating: 4.4, maturity: "G", durationMin: 15, views: 26000, publishedAt: "2025-07-06", posterPalette: 3, channelId: "ch-nova", status: "published", visibility: "public", categories: ["Lighting", "Documentary"], transcriptReady: false, videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "vid-natural-light-qa", kind: "video", title: "Natural Light: Anniversary Q&A", tagline: "Ten years of daylight, answered.", description: "A live Q&A marking a decade of the natural-light field guides, including the golden-hour question that never goes away.", genres: ["Documentary"], year: 2025, rating: 4.3, maturity: "G", durationMin: 15, views: 11000, publishedAt: "2025-08-19", posterPalette: 3, channelId: "ch-nova", status: "published", visibility: "public", categories: ["Lighting", "Q&A"], transcriptReady: false, videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "vid-open-cinema-50", kind: "video", title: "Encoding Open Cinema for the Archive", tagline: "Codecs outlive us all.", description: "How free-culture films are prepared for long-term archiving: mezzanine files, checksums and which containers to trust.", genres: ["Documentary", "Tutorial"], year: 2025, rating: 4.5, maturity: "G", durationMin: 15, views: 73000, publishedAt: "2025-06-04", posterPalette: 3, channelId: "ch-atlas", status: "published", visibility: "public", categories: ["Archival", "Tutorial"], transcriptReady: true, videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "vid-sintel-essay", kind: "video", title: "Sintel, Re-watched", tagline: "A dragon, a promise, and the cost of both.", description: "A close reading of the Blender Foundation's open-movie classic: its structure, its silence, and why the last shot lands so hard.", genres: ["Documentary", "Critique"], year: 2025, rating: 4.7, maturity: "G", durationMin: 15, views: 55000, publishedAt: "2025-06-25", posterPalette: 3, channelId: "ch-atlas", status: "published", visibility: "public", categories: ["Critique & Analysis"], transcriptReady: true, videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "vid-tortilla", kind: "video", title: "One Tortilla, Ten Ways", tagline: "Flat bread, tall order.", description: "Harbour Street Kitchen's most-requested episode: one dough, ten toppings, and the pier that ate them all.", genres: ["Documentary", "Food"], year: 2025, rating: 4.9, maturity: "G", durationMin: 15, views: 28000, publishedAt: "2025-08-14", posterPalette: 3, channelId: "ch-harbour", status: "published", visibility: "public", categories: ["Food", "Documentary"], transcriptReady: true, videoUrl: SAMPLE_VIDEOS.fun },
  { id: "vid-nanay-portrait", kind: "video", title: "Nanay's Kitchen, Full Frame", tagline: "One road, one afternoon, one camera.", description: "A 30-minute provincial portrait: the director walks her hometown's one open road, camera at chest height, for one full afternoon.", genres: ["Documentary"], year: 2025, rating: 4.6, maturity: "G", durationMin: 15, views: 55000, publishedAt: "2025-08-14", posterPalette: 3, channelId: "ch-harbour", status: "published", visibility: "public", categories: ["Documentary"], transcriptReady: false, videoUrl: SAMPLE_VIDEOS.escapes },
  { id: "vid-draft-storyboard", kind: "video", title: "Storyboard Animatic", tagline: "A rough cut of the north wall story.", description: "Rough animatic for the upcoming documentary short about the last working berth on the north wall.", genres: ["Documentary"], year: 2025, rating: 0, maturity: "G", durationMin: 0, views: 0, publishedAt: "2025-08-19", posterPalette: 3, channelId: "ch-nova", status: "draft", visibility: "private", categories: ["Documentary"], transcriptReady: false, videoUrl: undefined },
  { id: "vid-processing-grade", kind: "video", title: "Colour Grade Pass", tagline: "Processing — check back soon.", description: "Final grade pass for the harbour short — rendering protective LUTs before publication.", genres: ["Documentary"], year: 2025, rating: 0, maturity: "G", durationMin: 0, views: 0, publishedAt: "2025-08-19", posterPalette: 3, channelId: "ch-nova", status: "processing", visibility: "private", categories: ["Documentary"], transcriptReady: false, videoUrl: undefined },
];
