// Mock data shaped to match the SQL schema in uploads/bd_keys.txt
// Tables modeled: users, genres, platforms, games, game_genres, wishlist,
// game_comments, game_rating, game_price_log, key_status, suppliers,
// key_batches, keys, orders, order_keys, payment_method, transactions,
// cart, images, image_games.
//
// Game catalog populated from the RAWG public catalog (cover image + name
// + release date + rating + genres). Studios and taglines are fabricated
// for the prototype since the public list endpoint does not include them.

// ---------- platforms ----------
const PLATFORMS = [
  { id: 1, name: "Steam",         tone: "oklch(0.62 0.10 240)", toneLight: "oklch(0.45 0.12 240)" },
  { id: 2, name: "Xbox",          tone: "oklch(0.65 0.16 145)", toneLight: "oklch(0.42 0.15 145)" },
  { id: 3, name: "PlayStation",   tone: "oklch(0.62 0.14 260)", toneLight: "oklch(0.42 0.14 260)" },
  { id: 4, name: "Nintendo Switch", tone: "oklch(0.65 0.18 25)", toneLight: "oklch(0.50 0.18 25)" },
  { id: 5, name: "Epic Games",    tone: "oklch(0.70 0.05 100)", toneLight: "oklch(0.40 0.04 100)" },
];
const platformById = (id) => PLATFORMS.find((p) => p.id === id) || PLATFORMS[0];

// ---------- genres (id 1-15 used by mock games) ----------
const GENRES = [
  { id: 1,  name: "Action" },
  { id: 2,  name: "Adventure" },
  { id: 3,  name: "RPG" },
  { id: 4,  name: "Shooter" },
  { id: 5,  name: "Indie" },
  { id: 6,  name: "Strategy" },
  { id: 7,  name: "Puzzle" },
  { id: 8,  name: "Racing" },
  { id: 9,  name: "Simulation" },
  { id: 10, name: "Sports" },
  { id: 11, name: "Open World" },
  { id: 12, name: "Atmospheric" },
  { id: 13, name: "Multiplayer" },
  { id: 14, name: "Souls-like" },
  { id: 15, name: "Co-op" },
];
const genreIdByName = (n) => GENRES.find((g) => g.name === n)?.id;

// ---------- key_status ----------
const KEY_STATUS = [
  { id: 1, status: "Available" },
  { id: 2, status: "Sold" },
  { id: 3, status: "Reserved" },
  { id: 4, status: "Expired" },
];

// ---------- payment methods ----------
const PAYMENT_METHODS = [
  { id: 1, name: "Credit Card" },
  { id: 2, name: "PIX" },
  { id: 3, name: "PayPal" },
  { id: 4, name: "Wallet" },
];

// ---------- suppliers ----------
const SUPPLIERS = [
  { id: 1, platform_id: 1, name: "Northgate Distrib.",  website: "northgate.example", contact_email: "ops@northgate.example", deleted: 0 },
  { id: 2, platform_id: 1, name: "BlueWave Codes",      website: "bluewave.example",  contact_email: "trade@bluewave.example", deleted: 0 },
  { id: 3, platform_id: 2, name: "Crown Keys Ltd.",     website: "crownkeys.example", contact_email: "sales@crownkeys.example", deleted: 0 },
  { id: 4, platform_id: 3, name: "Aurora Digital",      website: "auroradigital.example", contact_email: "hello@auroradigital.example", deleted: 0 },
  { id: 5, platform_id: 4, name: "Polaris Trade",       website: "polaristrade.example", contact_email: "info@polaristrade.example", deleted: 0 },
  { id: 6, platform_id: 5, name: "Helix Resellers",     website: "helixresellers.example", contact_email: "support@helixresellers.example", deleted: 0 },
];

// ---------- helpers for time-based mock data ----------
const TODAY = new Date(2026, 4, 7); // May 7, 2026
const dShift = (days) => { const d = new Date(TODAY); d.setDate(d.getDate() + days); return d; };
const fmtISO = (d) => d.toISOString().slice(0, 19).replace("T", " ");

// price log builder: list of {old_price, new_price, changed_at}
const buildPriceLog = (gameId, prices) => {
  const log = [];
  for (let i = 1; i < prices.length; i++) {
    log.push({
      id: gameId * 100 + i,
      game_id: gameId,
      old_price: prices[i - 1],
      new_price: prices[i],
      changed_at: fmtISO(dShift(-((prices.length - i) * 28))),
    });
  }
  return log;
};

// Deterministic synth for a stable price curve from an integer seed.
const priceCurve = (basePrice, seed) => {
  let s = seed * 7919 + 13;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const arr = [basePrice];
  let cur = basePrice;
  for (let i = 0; i < 8; i++) {
    const r = rand();
    if (r < 0.30)        cur = Math.max(basePrice * 0.50, cur - basePrice * 0.10);  // discount
    else if (r < 0.50)   cur = Math.min(basePrice, cur + basePrice * 0.10);          // recover
    else                 cur = cur;                                                  // hold
    arr.push(Math.round(cur * 100) / 100);
  }
  return arr;
};

// ---------- games + relations ----------
// Real games sourced from RAWG public catalog (api.rawg.io). Image URLs are
// Cloudinary-hosted on RAWG's CDN and embedded directly in the prototype.
const GAMES = [
  // 1
  { id: 1, active_platform_id: 1, name: "Grand Theft Auto V", studio: "Rockstar Games",
    description: "Sprawling open-world crime epic following three criminals through Los Santos. Three switchable protagonists, a dense single-player heist campaign, and the sprawling GTA Online metagame.",
    release_date: "2013-09-17 00:00:00", price: 29.99, deleted: 0,
    cover: "drift", image: "https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg",
    tagline: "One city. Three criminals. Endless trouble.",
    features: ["Single-player", "Online (30)", "Cloud saves", "Controller support"], rawg_rating: 4.47, rawg_genres: ["Action", "Adventure"] },
  // 2
  { id: 2, active_platform_id: 1, name: "The Witcher 3: Wild Hunt", studio: "CD Projekt Red",
    description: "A geralt-of-rivia open-world RPG with mature, branching quests, weighty monster contracts, and one of the most respected scripts in the medium.",
    release_date: "2015-05-18 00:00:00", price: 39.99, deleted: 0,
    cover: "veil", image: "https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg",
    tagline: "Hunt monsters. Make impossible choices.",
    features: ["Single-player", "60+ hours", "4K HDR", "Mod support"], rawg_rating: 4.66, rawg_genres: ["Action", "RPG", "Adventure"] },
  // 3
  { id: 3, active_platform_id: 1, name: "Portal 2", studio: "Valve",
    description: "Co-op and singleplayer puzzle masterclass. The portal gun is back, GLaDOS has friends, and the writing remains the gold standard for environmental comedy.",
    release_date: "2011-04-18 00:00:00", price: 9.99, deleted: 0,
    cover: "cipher", image: "https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg",
    tagline: "Now you're thinking with portals.",
    features: ["Single-player", "Online co-op (2)", "Steam Workshop", "Achievements"], rawg_rating: 4.61, rawg_genres: ["Puzzle", "Shooter"] },
  // 4
  { id: 4, active_platform_id: 1, name: "Tomb Raider (2013)", studio: "Crystal Dynamics",
    description: "Lara's gritty origin story. Survive a hostile island, scavenge for arrows, and watch a young archaeologist become a legend.",
    release_date: "2013-03-05 00:00:00", price: 19.99, deleted: 0,
    cover: "ember", image: "https://media.rawg.io/media/games/021/021c4e21a1824d2526f925eff6324653.jpg",
    tagline: "A survivor is born.",
    features: ["Single-player", "Cloud saves", "Controller support"], rawg_rating: 4.05, rawg_genres: ["Action", "Adventure"] },
  // 5
  { id: 5, active_platform_id: 1, name: "Counter-Strike: Global Offensive", studio: "Valve",
    description: "The benchmark competitive shooter. Five-on-five tactical rounds, a rifle economy, and a community that has not stopped playing for over a decade.",
    release_date: "2012-08-21 00:00:00", price: 0.00, deleted: 0,
    cover: "monolith", image: "https://media.rawg.io/media/games/736/73619bd336c894d6941d926bfd563946.jpg",
    tagline: "Aim. Communicate. Win.",
    features: ["Online (10)", "Ranked", "Workshop", "Free-to-play"], rawg_rating: 3.57, rawg_genres: ["Shooter"] },
  // 6
  { id: 6, active_platform_id: 1, name: "Half-Life 2", studio: "Valve",
    description: "Gordon Freeman returns. A first-person shooter that taught the medium how to handle pacing, physics, and quiet dread.",
    release_date: "2004-11-16 00:00:00", price: 9.99, deleted: 0,
    cover: "hollow", image: "https://media.rawg.io/media/games/b8c/b8c243eaa0fbac8115e0cdccac3f91dc.jpg",
    tagline: "The right man in the wrong place.",
    features: ["Single-player", "Steam Workshop", "Steam Deck verified"], rawg_rating: 4.49, rawg_genres: ["Shooter", "Action"] },
  // 7
  { id: 7, active_platform_id: 1, name: "Red Dead Redemption 2", studio: "Rockstar Games",
    description: "An end-of-the-Old-West epic. Ride with the Van der Linde gang as the world they belong to disappears around them.",
    release_date: "2018-10-26 00:00:00", price: 59.99, deleted: 0,
    cover: "ember", image: "https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg",
    tagline: "An outlaw for life.",
    features: ["Single-player", "Online (30)", "4K HDR", "Cloud saves"], rawg_rating: 4.59, rawg_genres: ["Adventure", "Action"] },
  // 8
  { id: 8, active_platform_id: 1, name: "Left 4 Dead 2", studio: "Valve",
    description: "Four-player co-op zombie shooter that still anchors the genre. Special infected, dynamic AI director, and the best campaign chemistry in any shooter.",
    release_date: "2009-11-17 00:00:00", price: 9.99, deleted: 0,
    cover: "drift", image: "https://media.rawg.io/media/games/d58/d588947d4286e7b5e0e12e1bea7d9844.jpg",
    tagline: "Reach the safe house. Together.",
    features: ["Online co-op (4)", "Versus", "Steam Workshop"], rawg_rating: 4.10, rawg_genres: ["Shooter", "Co-op"] },
  // 9
  { id: 9, active_platform_id: 1, name: "Borderlands 2", studio: "Gearbox Software",
    description: "Looter-shooter at its loudest. Bazillions of guns, cel-shaded mayhem, and a script that holds up.",
    release_date: "2012-09-18 00:00:00", price: 19.99, deleted: 0,
    cover: "ember", image: "https://media.rawg.io/media/games/49c/49c3dfa4ce2f6f140cc4825868e858cb.jpg",
    tagline: "87 bazillion guns and counting.",
    features: ["Online co-op (4)", "Single-player", "Cloud saves"], rawg_rating: 4.03, rawg_genres: ["Action", "Shooter", "RPG"] },
  // 10
  { id: 10, active_platform_id: 1, name: "BioShock Infinite", studio: "Irrational Games",
    description: "Columbia, a city in the clouds. A first-person narrative shooter that wrestles with American mythology and quantum guilt.",
    release_date: "2013-03-26 00:00:00", price: 14.99, deleted: 0,
    cover: "cipher", image: "https://media.rawg.io/media/games/fc1/fc1307a2774506b5bd65d7e8424664a7.jpg",
    tagline: "Bring us the girl, and wipe away the debt.",
    features: ["Single-player", "Cloud saves", "Achievements"], rawg_rating: 4.37, rawg_genres: ["Shooter", "Adventure"] },
  // 11
  { id: 11, active_platform_id: 5, name: "Life is Strange", studio: "Dontnod Entertainment",
    description: "Episodic narrative adventure about a teenager who discovers she can rewind time. Photography, friendship, and consequences.",
    release_date: "2015-01-29 00:00:00", price: 19.99, deleted: 0,
    cover: "veil", image: "https://media.rawg.io/media/games/562/562553814dd54e001a541e4ee83a591c.jpg",
    tagline: "Every choice rewinds.",
    features: ["Single-player", "Episodic", "Achievements"], rawg_rating: 4.11, rawg_genres: ["Adventure", "Indie"] },
  // 12
  { id: 12, active_platform_id: 1, name: "BioShock", studio: "Irrational Games",
    description: "Welcome to Rapture. An immersive-sim shooter set in a failed underwater objectivist utopia. Defines a generation of narrative FPS.",
    release_date: "2007-08-21 00:00:00", price: 14.99, deleted: 0,
    cover: "monolith", image: "https://media.rawg.io/media/games/bc0/bc06a29ceac58652b684deefe7d56099.jpg",
    tagline: "Would you kindly?",
    features: ["Single-player", "Cloud saves"], rawg_rating: 4.38, rawg_genres: ["Shooter", "Adventure"] },
  // 13
  { id: 13, active_platform_id: 3, name: "Destiny 2", studio: "Bungie",
    description: "Online shooter MMO. Drop into shared worlds, build a Guardian, and chase god-roll loot through expansive seasonal stories.",
    release_date: "2017-09-06 00:00:00", price: 0.00, deleted: 0,
    cover: "drift", image: "https://media.rawg.io/media/games/34b/34b1f1850a1c06fd971bc6ab3ac0ce0e.jpg",
    tagline: "Become legend.",
    features: ["Online (6)", "Crossplay", "Free-to-play"], rawg_rating: 3.59, rawg_genres: ["Shooter", "Multiplayer"] },
  // 14
  { id: 14, active_platform_id: 3, name: "God of War (2018)", studio: "Santa Monica Studio",
    description: "Kratos and his son Atreus journey through the Norse realms. Single-camera cinematography, axe-throwing combat, and the best dad-game ever made.",
    release_date: "2018-04-20 00:00:00", price: 49.99, deleted: 0,
    cover: "ember", image: "https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg",
    tagline: "Boy.",
    features: ["Single-player", "4K HDR", "DualSense haptics"], rawg_rating: 4.55, rawg_genres: ["Action", "Adventure"] },
  // 15
  { id: 15, active_platform_id: 1, name: "Fallout 4", studio: "Bethesda Game Studios",
    description: "Post-nuclear Boston open-world RPG. Build settlements, modify weapons, and do whatever a Sole Survivor wants to do.",
    release_date: "2015-11-09 00:00:00", price: 29.99, deleted: 0,
    cover: "veil", image: "https://media.rawg.io/media/games/d82/d82990b9c67ba0d2d09d4e6fa88885a7.jpg",
    tagline: "War. War never changes.",
    features: ["Single-player", "Mod support", "Cloud saves"], rawg_rating: 3.80, rawg_genres: ["Action", "RPG", "Open World"] },
  // 16
  { id: 16, active_platform_id: 1, name: "Limbo", studio: "Playdead",
    description: "A monochrome side-scrolling puzzle-platformer about a boy searching for his sister. Unforgettable silhouettes and brutal physics puzzles.",
    release_date: "2010-07-21 00:00:00", price: 9.99, deleted: 0,
    cover: "hollow", image: "https://media.rawg.io/media/games/942/9424d6bb763dc38d9378b488603c87fa.jpg",
    tagline: "Uncertain of his sister's fate.",
    features: ["Single-player", "Steam Deck verified"], rawg_rating: 4.15, rawg_genres: ["Puzzle", "Indie"] },
  // 17
  { id: 17, active_platform_id: 5, name: "PAYDAY 2", studio: "Overkill Software",
    description: "Four-player co-op heist shooter. Plan the job, mask up, and improvise when it inevitably goes loud.",
    release_date: "2013-08-13 00:00:00", price: 9.99, deleted: 0,
    cover: "monolith", image: "https://media.rawg.io/media/games/73e/73eecb8909e0c39fb246f457b5d6cbbe.jpg",
    tagline: "Crime pays.",
    features: ["Online co-op (4)", "Workshop", "Crossplay"], rawg_rating: 3.51, rawg_genres: ["Shooter", "Action", "Co-op"] },
  // 18
  { id: 18, active_platform_id: 1, name: "Team Fortress 2", studio: "Valve",
    description: "Class-based hat economy with a multiplayer shooter attached. Nine classes, infinite cosmetic depth, and decade-long memes.",
    release_date: "2007-10-10 00:00:00", price: 0.00, deleted: 0,
    cover: "drift", image: "https://media.rawg.io/media/games/46d/46d98e6910fbc0706e2948a7cc9b10c5.jpg",
    tagline: "Nine classes. Infinite hats.",
    features: ["Online (12+)", "Workshop", "Free-to-play"], rawg_rating: 4.07, rawg_genres: ["Shooter", "Multiplayer"] },
  // 19
  { id: 19, active_platform_id: 1, name: "Minecraft", studio: "Mojang Studios",
    description: "Place blocks. Mine blocks. Survive the night. The most successful sandbox game ever made.",
    release_date: "2009-05-10 00:00:00", price: 26.95, deleted: 0,
    cover: "ember", image: "https://media.rawg.io/media/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg",
    tagline: "Build anything.",
    features: ["Single-player", "Online (8)", "Modding", "Cross-play"], rawg_rating: 4.42, rawg_genres: ["Adventure", "Indie", "Simulation"] },
  // 20
  { id: 20, active_platform_id: 1, name: "Rocket League", studio: "Psyonix",
    description: "Cars. Soccer. Rocket boosters. Twelve seconds to read a play and ten more to score. Still the cleanest pick-up-and-play multiplayer on PC.",
    release_date: "2015-07-07 00:00:00", price: 0.00, deleted: 0,
    cover: "drift", image: "https://media.rawg.io/media/games/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg",
    tagline: "Cars. Soccer. Rockets.",
    features: ["Online (8)", "Cross-platform", "Free-to-play", "Local co-op"], rawg_rating: 3.93, rawg_genres: ["Sports", "Racing", "Indie"] },
  // 21
  { id: 21, active_platform_id: 1, name: "DOOM (2016)", studio: "id Software",
    description: "Reboot of the genre's progenitor. Glory kills, push-forward combat, and the most aggressive heavy-metal score in any shooter.",
    release_date: "2016-05-13 00:00:00", price: 19.99, deleted: 0,
    cover: "monolith", image: "https://media.rawg.io/media/games/c4b/c4b0cab189e73432de3a250d8cf1c84e.jpg",
    tagline: "Rip and tear.",
    features: ["Single-player", "Multiplayer", "SnapMap editor"], rawg_rating: 4.39, rawg_genres: ["Shooter", "Action"] },
  // 22
  { id: 22, active_platform_id: 1, name: "Bloodborne", studio: "FromSoftware",
    description: "Gothic action-RPG set in the cursed city of Yharnam. Trick weapons, blood echoes, and a soundtrack that will live in your head.",
    release_date: "2015-03-24 00:00:00", price: 19.99, deleted: 0,
    cover: "hollow", image: "https://media.rawg.io/media/games/214/214b29aeff13a0ae6a70fc4426e85991.jpg",
    tagline: "A hunt by night.",
    features: ["Single-player", "Online co-op", "PvP"], rawg_rating: 4.49, rawg_genres: ["Action", "RPG", "Souls-like"] },
  // 23
  { id: 23, active_platform_id: 3, name: "Horizon Zero Dawn", studio: "Guerrilla Games",
    description: "Post-post-apocalyptic open-world action-RPG. Mechanical wildlife, tribal politics, and one of the most striking art directions of its console generation.",
    release_date: "2017-02-28 00:00:00", price: 49.99, deleted: 0,
    cover: "drift", image: "https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg",
    tagline: "In a world overrun by machines.",
    features: ["Single-player", "4K HDR", "Photo mode"], rawg_rating: 4.27, rawg_genres: ["Action", "RPG", "Open World"] },
  // 24
  { id: 24, active_platform_id: 1, name: "Mass Effect 2", studio: "BioWare",
    description: "Space-opera RPG. Assemble a crew, romance an alien, save the galaxy. The companion writing is still unmatched.",
    release_date: "2010-01-26 00:00:00", price: 19.99, deleted: 0,
    cover: "cipher", image: "https://media.rawg.io/media/games/5c0/5c0dd63002cb23f804aab327d40ef119.jpg",
    tagline: "Assemble the crew.",
    features: ["Single-player", "Cloud saves", "DLC included"], rawg_rating: 4.42, rawg_genres: ["RPG", "Adventure", "Shooter"] },
  // 25
  { id: 25, active_platform_id: 1, name: "Hollow Knight", studio: "Team Cherry",
    description: "Hand-drawn 2D Metroidvania set in the ruined kingdom of Hallownest. Explore twisting caverns, fight haunting bosses, and uncover the kingdom's mysteries with a tiny knight and a battered nail.",
    release_date: "2017-02-23 00:00:00", price: 14.99, deleted: 0,
    cover: "hollow", image: "https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg",
    tagline: "Forge your own path.",
    features: ["Single-player", "Controller support", "Cloud saves", "Steam Deck verified"], rawg_rating: 4.40, rawg_genres: ["Action", "Indie", "Atmospheric"] },
  // 26
  { id: 26, active_platform_id: 1, name: "Hollow Knight: Silksong", studio: "Team Cherry",
    description: "The long-awaited sequel. Play as Hornet, princess-protector of Hallownest, ascending a haunted kingdom of silk and song. Faster combat, new tools, and a brand-new world to unravel.",
    release_date: "2025-09-04 00:00:00", price: 19.99, deleted: 0,
    cover: "veil", image: "https://media.rawg.io/media/games/27c/27cd8b7dead05a870f8a514a9a1915ad.jpg",
    tagline: "Ascend a haunted kingdom.",
    features: ["Single-player", "Controller support", "Cloud saves", "60+ hours"], rawg_rating: 4.38, rawg_genres: ["Action", "Adventure", "Indie"] },
];

// Build GAME_GENRES from each game's rawg_genres
const GAME_GENRES = (() => {
  const out = []; let id = 1;
  for (const g of GAMES) {
    for (const gn of g.rawg_genres) {
      const gid = genreIdByName(gn);
      if (gid) out.push({ id: id++, game_id: g.id, genre_id: gid });
    }
  }
  return out;
})();
const genresOf = (gameId) =>
  GAME_GENRES.filter((g) => g.game_id === gameId)
    .map((g) => GENRES.find((x) => x.id === g.genre_id)?.name)
    .filter(Boolean);

// Build per-game price log from each game's base price
const PRICE_LOG = GAMES.flatMap((g) => buildPriceLog(g.id, priceCurve(g.price || 9.99, g.id)));
const priceLogOf = (gameId) => PRICE_LOG.filter((p) => p.game_id === gameId);

// Aggregate ratings — derive from RAWG rating (4.0–4.7) → mapped to 7.5–9.5/10
// then assign a count proportional to the game's popularity (use the price as a
// rough proxy of mainstream weight, plus a deterministic spread).
const GAME_RATING_AGG = (() => {
  const out = {};
  for (const g of GAMES) {
    const avg = Math.max(6.5, Math.min(9.7, g.rawg_rating * 2 - 0.05));
    const seed = (g.id * 37 + 11) % 50;
    const count = Math.round(2000 + seed * 850 + (g.price >= 30 ? 5000 : 1000));
    out[g.id] = { avg: Math.round(avg * 10) / 10, count };
  }
  return out;
})();

// users (small mock pool)
const USERS = [
  { id: 1,  first_name: "Mira",   last_name: "Okafor",   nickname: "miraflux",     email: "mira@example.com",   amount: 142.50, created_at: "2025-08-12 10:21:00", deleted: 0 },
  { id: 2,  first_name: "Theo",   last_name: "Brennan",  nickname: "theobr",       email: "theo@example.com",   amount:  18.20, created_at: "2025-09-30 18:02:00", deleted: 0 },
  { id: 3,  first_name: "Yuki",   last_name: "Tanabe",   nickname: "yuki.t",       email: "yuki@example.com",   amount: 220.00, created_at: "2025-11-04 09:11:00", deleted: 0 },
  { id: 4,  first_name: "Ines",   last_name: "Costa",    nickname: "inesco",       email: "ines@example.com",   amount:  44.10, created_at: "2026-01-18 16:48:00", deleted: 0 },
  { id: 5,  first_name: "Kojo",   last_name: "Mensah",   nickname: "kojo_m",       email: "kojo@example.com",   amount:  72.99, created_at: "2026-02-22 13:30:00", deleted: 0 },
  { id: 6,  first_name: "Lia",    last_name: "Ferreira", nickname: "liafe",        email: "lia@example.com",    amount:  10.00, created_at: "2026-03-04 11:00:00", deleted: 0 },
  { id: 7,  first_name: "Owen",   last_name: "Park",     nickname: "owenp",        email: "owen@example.com",   amount: 305.40, created_at: "2026-03-14 17:25:00", deleted: 0 },
  { id: 8,  first_name: "Rhea",   last_name: "Singh",    nickname: "rheasng",      email: "rhea@example.com",   amount:  60.00, created_at: "2026-04-02 08:15:00", deleted: 0 },
];
const userById = (id) => USERS.find((u) => u.id === id);

// ---------- comments — curated for top games ----------
const GAME_COMMENTS = [
  { id: 1, user_id: 1, game_id: 2, comment_text: "Hours just disappeared. The Bloody Baron quest alone is worth the entry.", created_at: "2026-04-12 21:04:00", deleted: 0 },
  { id: 2, user_id: 7, game_id: 2, comment_text: "Came for monsters, stayed for the writing. Hearts of Stone is a masterpiece.", created_at: "2026-04-29 13:22:00", deleted: 0 },
  { id: 3, user_id: 3, game_id: 2, comment_text: "Combat is just OK but the world makes up for it ten times over.", created_at: "2026-05-02 09:48:00", deleted: 0 },
  { id: 4, user_id: 2, game_id: 1, comment_text: "Online still surprisingly active in 2026. Single-player heists hold up.", created_at: "2026-04-06 19:12:00", deleted: 0 },
  { id: 5, user_id: 4, game_id: 3, comment_text: "Best co-op puzzle game ever made. Period.", created_at: "2026-04-25 22:00:00", deleted: 0 },
  { id: 6, user_id: 5, game_id: 14, comment_text: "Boy. Boy. BOY. Combat feel is unreal.", created_at: "2026-04-30 11:33:00", deleted: 0 },
  { id: 7, user_id: 6, game_id: 7, comment_text: "Slowest game I have ever loved. Riding into a sunset has never hit harder.", created_at: "2026-05-01 14:09:00", deleted: 0 },
  { id: 8, user_id: 8, game_id: 22, comment_text: "Yharnam ate me alive. Trick weapons are the best in the genre.", created_at: "2026-05-03 18:51:00", deleted: 0 },
  { id: 9, user_id: 7, game_id: 21, comment_text: "Push-forward combat plus that soundtrack — I have not stopped grinning.", created_at: "2026-05-04 10:00:00", deleted: 0 },
  { id: 10, user_id: 1, game_id: 6, comment_text: "Still the best opening level of any FPS, twenty years on.", created_at: "2026-05-04 22:15:00", deleted: 0 },
  { id: 11, user_id: 4, game_id: 11, comment_text: "Made me cry on a bus. The score is half of why this game works.", created_at: "2026-04-20 19:30:00", deleted: 0 },
  { id: 12, user_id: 5, game_id: 19, comment_text: "Bought it for my kid. Now I play after they go to sleep.", created_at: "2026-05-02 23:42:00", deleted: 0 },
  { id: 13, user_id: 3, game_id: 24, comment_text: "Loyalty missions are the gold standard for character writing in games.", created_at: "2026-04-28 16:00:00", deleted: 0 },
  { id: 14, user_id: 2, game_id: 16, comment_text: "Three hours, no dialogue, ten years of nightmares. Worth every cent.", created_at: "2026-04-15 11:22:00", deleted: 0 },
];
const commentsOf = (gameId) =>
  GAME_COMMENTS.filter((c) => c.game_id === gameId && c.deleted === 0)
    .map((c) => ({ ...c, user: userById(c.user_id) }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

// wishlist — broader spread across catalog
const WISHLIST = [
  { id: 1, user_id: 1, game_id: 7,  created_at: "2026-04-01 12:00:00" },
  { id: 2, user_id: 1, game_id: 14, created_at: "2026-04-04 18:33:00" },
  { id: 3, user_id: 3, game_id: 22, created_at: "2026-04-10 09:30:00" },
  { id: 4, user_id: 4, game_id: 11, created_at: "2026-04-15 21:11:00" },
  { id: 5, user_id: 7, game_id: 2,  created_at: "2026-04-20 14:42:00" },
  { id: 6, user_id: 7, game_id: 21, created_at: "2026-04-22 10:00:00" },
  { id: 7, user_id: 5, game_id: 13, created_at: "2026-04-25 19:20:00" },
  { id: 8, user_id: 2, game_id: 24, created_at: "2026-04-29 08:08:00" },
  { id: 9, user_id: 6, game_id: 19, created_at: "2026-04-30 11:11:00" },
  { id: 10, user_id: 8, game_id: 16, created_at: "2026-05-01 17:55:00" },
  { id: 11, user_id: 1, game_id: 22, created_at: "2026-05-02 09:09:00" },
  { id: 12, user_id: 3, game_id: 6,  created_at: "2026-05-03 14:00:00" },
];
const wishlistCountOf = (gameId) => WISHLIST.filter((w) => w.game_id === gameId).length;

// key_batches (procurement) — generate 1-2 batches per game from supplier matched to platform
const KEY_BATCHES = (() => {
  const out = []; let id = 1;
  for (const g of GAMES) {
    const candidates = SUPPLIERS.filter((s) => s.platform_id === g.active_platform_id);
    const supplier = candidates[0] || SUPPLIERS[0];
    const supplier2 = candidates[1] || candidates[0] || SUPPLIERS[0];
    const cost1 = Math.max(0.5, g.price * (0.45 + ((g.id * 7) % 10) / 100));
    const cost2 = Math.max(0.5, g.price * (0.42 + ((g.id * 11) % 10) / 100));
    const qty1 = 200 + (g.id * 53) % 800;
    out.push({ id: id++, game_id: g.id, supplier_id: supplier.id,
      unit_price: Math.round(cost1 * 100) / 100, quantity: qty1,
      purchase_date: fmtISO(dShift(-((g.id * 13) % 200) - 30)) });
    if (g.id % 2 === 0) {
      const qty2 = 100 + (g.id * 31) % 500;
      out.push({ id: id++, game_id: g.id, supplier_id: supplier2.id,
        unit_price: Math.round(cost2 * 100) / 100, quantity: qty2,
        purchase_date: fmtISO(dShift(-((g.id * 7) % 90) - 5)) });
    }
  }
  return out;
})();

// keys: aggregated counts per game/status
const KEY_INVENTORY = (() => {
  const out = [];
  for (const g of GAMES) {
    // deterministic distribution
    const seed = g.id;
    const total = 600 + (seed * 71) % 900;
    const sold = Math.round(total * (0.35 + ((seed * 17) % 50) / 100));
    const reserved = (seed * 5) % 28;
    const expired = (seed * 3) % 5;
    const available = Math.max(0, total - sold - reserved - expired);
    out.push({ game_id: g.id, status_id: 1, count: available });
    out.push({ game_id: g.id, status_id: 2, count: sold });
    out.push({ game_id: g.id, status_id: 3, count: reserved });
    out.push({ game_id: g.id, status_id: 4, count: expired });
  }
  // Ensure a couple games are sold-out to exercise that UI
  const soldOutIds = [5, 18];  // CS:GO, TF2 — free games, key concept doesn't make sense, force sold-out
  for (const r of out) {
    if (soldOutIds.includes(r.game_id) && r.status_id === 1) r.count = 0;
  }
  return out;
})();
const availableKeysOf = (gameId) =>
  KEY_INVENTORY.find((k) => k.game_id === gameId && k.status_id === 1)?.count ?? 0;
const soldKeysOf = (gameId) =>
  KEY_INVENTORY.find((k) => k.game_id === gameId && k.status_id === 2)?.count ?? 0;

// orders + order_keys + transactions: build a 90-day timeline
const ORDERS = [];
const ORDER_KEYS = [];
const TRANSACTIONS = [];
(function buildOrders() {
  let orderId = 1, orderKeyId = 1, txId = 1, keyIdSeed = 5000;
  let s = 42;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  // Weight game selection by inverse-price + popularity bump for top titles
  const weights = GAMES.map((g) => {
    let w = 1;
    if (g.price === 0) w += 4;             // free games over-represented in the cart
    if (g.price > 0 && g.price < 15) w += 2;
    if (g.price > 30) w -= 0.3;
    if (GAME_RATING_AGG[g.id]?.avg >= 9.0) w += 1.5;
    return Math.max(0.3, w);
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const pickGame = () => {
    let r = rng() * totalWeight;
    for (let i = 0; i < GAMES.length; i++) { r -= weights[i]; if (r <= 0) return GAMES[i]; }
    return GAMES[GAMES.length - 1];
  };
  for (let dayOffset = -89; dayOffset <= 0; dayOffset++) {
    const date = dShift(dayOffset);
    const weekend = [0, 6].includes(date.getDay());
    const ordersToday = 8 + Math.floor(rng() * 8) + (weekend ? 4 : 0);
    for (let o = 0; o < ordersToday; o++) {
      const userId = 1 + Math.floor(rng() * USERS.length);
      const dt = new Date(date); dt.setHours(Math.floor(rng() * 24)); dt.setMinutes(Math.floor(rng() * 60));
      const itemCount = 1 + Math.floor(rng() * 3);
      const order = { id: orderId, user_id: userId, purchase_datetime: fmtISO(dt) };
      let total = 0;
      for (let it = 0; it < itemCount; it++) {
        const game = pickGame();
        const unit = Math.max(0.99, game.price * (rng() > 0.85 ? 0.85 : 1));
        ORDER_KEYS.push({
          id: orderKeyId++, order_id: orderId, key_id: keyIdSeed++,
          unit_price: Math.round(unit * 100) / 100, _game_id: game.id,
        });
        total += unit;
      }
      ORDERS.push(order);
      const pmId = [1, 1, 1, 2, 2, 3, 4][Math.floor(rng() * 7)];
      TRANSACTIONS.push({
        id: txId++, order_id: orderId, payment_method_id: pmId,
        status: rng() > 0.04 ? "completed" : "refunded",
        transaction_datetime: fmtISO(dt),
        total_price: Math.round(total * 100) / 100,
      });
      orderId++;
    }
  }
})();

// Build daily revenue series for charts
const DAILY_REVENUE = (() => {
  const map = new Map();
  for (const tx of TRANSACTIONS) {
    if (tx.status !== "completed") continue;
    const d = tx.transaction_datetime.slice(0, 10);
    map.set(d, (map.get(d) || 0) + tx.total_price);
  }
  const out = [];
  for (let i = -89; i <= 0; i++) {
    const iso = dShift(i).toISOString().slice(0, 10);
    out.push({ date: iso, revenue: Math.round((map.get(iso) || 0) * 100) / 100 });
  }
  return out;
})();

// Top games by revenue — proper aggregation by game_id stamped on each order_key
const TOP_GAMES_REVENUE = (() => {
  const map = new Map();
  for (const ok of ORDER_KEYS) {
    const ord = ORDERS.find((o) => o.id === ok.order_id);
    const tx = TRANSACTIONS.find((t) => t.order_id === ord.id);
    if (!tx || tx.status !== "completed") continue;
    map.set(ok._game_id, (map.get(ok._game_id) || 0) + ok.unit_price);
  }
  return GAMES.map((g) => ({
    game_id: g.id,
    name: g.name,
    revenue: Math.round((map.get(g.id) || 0) * 100) / 100,
  })).sort((a, b) => b.revenue - a.revenue);
})();

// Inventory totals across all games
const INVENTORY_TOTALS = (() => {
  const totals = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const r of KEY_INVENTORY) totals[r.status_id] += r.count;
  return KEY_STATUS.map((s) => ({ status: s.status, count: totals[s.id] || 0 }));
})();

// Cover art definitions (used as decorative overlay tinting / fallback when image fails)
const COVERS = {
  hollow: {
    bg: "linear-gradient(135deg, oklch(0.30 0.10 290) 0%, oklch(0.18 0.06 250) 100%)",
    bgLight: "linear-gradient(135deg, oklch(0.42 0.14 290) 0%, oklch(0.32 0.10 250) 100%)",
    glyphs: [
      { x: 18, y: 22, r: 38, c: "oklch(0.85 0.18 165 / 0.18)", cL: "oklch(0.78 0.20 165 / 0.45)" },
      { x: 78, y: 70, r: 24, c: "oklch(0.78 0.16 70 / 0.20)",  cL: "oklch(0.80 0.18 70 / 0.40)" },
    ],
    ring: "oklch(0.85 0.18 165 / 0.55)",
    ringLight: "oklch(0.85 0.20 165 / 0.75)",
  },
  veil: {
    bg: "linear-gradient(160deg, oklch(0.22 0.05 25) 0%, oklch(0.14 0.03 30) 100%)",
    bgLight: "linear-gradient(160deg, oklch(0.40 0.12 25) 0%, oklch(0.28 0.08 30) 100%)",
    glyphs: [
      { x: 70, y: 28, r: 30, c: "oklch(0.78 0.16 30 / 0.30)", cL: "oklch(0.78 0.18 30 / 0.50)" },
      { x: 30, y: 72, r: 18, c: "oklch(0.88 0.10 70 / 0.22)", cL: "oklch(0.85 0.14 70 / 0.40)" },
    ],
    ring: "oklch(0.82 0.16 35 / 0.55)",
    ringLight: "oklch(0.85 0.18 35 / 0.75)",
  },
  cipher: {
    bg: "linear-gradient(140deg, oklch(0.22 0.06 200) 0%, oklch(0.15 0.04 220) 100%)",
    bgLight: "linear-gradient(140deg, oklch(0.40 0.10 200) 0%, oklch(0.28 0.08 220) 100%)",
    glyphs: [
      { x: 50, y: 50, r: 44, c: "oklch(0.85 0.14 200 / 0.18)", cL: "oklch(0.85 0.18 200 / 0.40)" },
      { x: 22, y: 24, r: 12, c: "oklch(0.85 0.18 165 / 0.30)", cL: "oklch(0.85 0.20 165 / 0.55)" },
    ],
    ring: "oklch(0.85 0.16 195 / 0.55)",
    ringLight: "oklch(0.85 0.18 195 / 0.75)",
  },
  drift: {
    bg: "linear-gradient(150deg, oklch(0.24 0.04 140) 0%, oklch(0.14 0.03 150) 100%)",
    bgLight: "linear-gradient(150deg, oklch(0.42 0.10 140) 0%, oklch(0.28 0.06 150) 100%)",
    glyphs: [
      { x: 65, y: 35, r: 28, c: "oklch(0.85 0.18 145 / 0.25)", cL: "oklch(0.85 0.20 145 / 0.50)" },
      { x: 30, y: 70, r: 20, c: "oklch(0.78 0.10 100 / 0.22)", cL: "oklch(0.82 0.14 100 / 0.40)" },
    ],
    ring: "oklch(0.85 0.18 145 / 0.55)",
    ringLight: "oklch(0.85 0.20 145 / 0.75)",
  },
  monolith: {
    bg: "linear-gradient(135deg, oklch(0.22 0.02 280) 0%, oklch(0.13 0.02 270) 100%)",
    bgLight: "linear-gradient(135deg, oklch(0.38 0.04 280) 0%, oklch(0.26 0.03 270) 100%)",
    glyphs: [
      { x: 50, y: 50, r: 36, c: "oklch(0.80 0.04 280 / 0.30)", cL: "oklch(0.80 0.06 280 / 0.40)" },
      { x: 80, y: 20, r: 10, c: "oklch(0.85 0.18 165 / 0.40)", cL: "oklch(0.85 0.20 165 / 0.60)" },
    ],
    ring: "oklch(0.85 0.04 280 / 0.55)",
    ringLight: "oklch(0.85 0.06 280 / 0.75)",
  },
  ember: {
    bg: "linear-gradient(150deg, oklch(0.24 0.08 50) 0%, oklch(0.14 0.04 40) 100%)",
    bgLight: "linear-gradient(150deg, oklch(0.42 0.14 50) 0%, oklch(0.28 0.08 40) 100%)",
    glyphs: [
      { x: 32, y: 32, r: 32, c: "oklch(0.85 0.14 60 / 0.22)", cL: "oklch(0.85 0.18 60 / 0.45)" },
      { x: 70, y: 70, r: 22, c: "oklch(0.80 0.18 30 / 0.25)", cL: "oklch(0.80 0.20 30 / 0.50)" },
    ],
    ring: "oklch(0.85 0.16 55 / 0.55)",
    ringLight: "oklch(0.85 0.20 55 / 0.75)",
  },
};

// Currencies
const CURRENCIES = {
  USD: { code: "USD", symbol: "$",  rate: 1.00,  locale: "en-US", flag: "🇺🇸" },
  BRL: { code: "BRL", symbol: "R$", rate: 5.10,  locale: "pt-BR", flag: "🇧🇷" },
  EUR: { code: "EUR", symbol: "€",  rate: 0.93,  locale: "de-DE", flag: "🇪🇺" },
  GBP: { code: "GBP", symbol: "£",  rate: 0.79,  locale: "en-GB", flag: "🇬🇧" },
};

const fmtMoney = (usd, code = "USD") => {
  const c = CURRENCIES[code];
  const v = usd * c.rate;
  const parts = v.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, code === "BRL" || code === "EUR" ? "." : ",");
  const sep = code === "BRL" || code === "EUR" ? "," : ".";
  return `${c.symbol}${parts.join(sep)}`;
};

// Expose to global scope for other Babel scripts
Object.assign(window, {
  PLATFORMS, GENRES, KEY_STATUS, PAYMENT_METHODS, SUPPLIERS, GAMES, GAME_GENRES,
  PRICE_LOG, GAME_RATING_AGG, USERS, GAME_COMMENTS, WISHLIST, KEY_BATCHES,
  KEY_INVENTORY, ORDERS, ORDER_KEYS, TRANSACTIONS, DAILY_REVENUE,
  TOP_GAMES_REVENUE, INVENTORY_TOTALS, COVERS, CURRENCIES,
  platformById, genresOf, priceLogOf, commentsOf, wishlistCountOf,
  availableKeysOf, soldKeysOf, userById, fmtMoney, TODAY,
});
