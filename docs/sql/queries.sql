--Selects

-- Lists games with low available stock of keys.
SELECT g."name",kp."total_keys", ak."available_keys"
FROM "games" g
LEFT JOIN "keys_per_game" kp ON g."name" = kp."name"
LEFT JOIN "available_keys_per_game" ak ON g."name" = ak."name"
WHERE ak."available_keys" < 5
ORDER BY ak."available_keys" ASC;

-- List each game's revenue, total cost of all keys purchased, and total profit
SELECT g."name", r."total_revenue", c."total_cost",p."total_profit"
FROM "games" g
JOIN "revenue_per_game" r ON g."id" = r."game_id"
JOIN "cost_per_game" c ON g."id" = c."game_id"
JOIN "profit_per_game" p ON g."id" = p."game_id"
ORDER BY p."total_profit" DESC;

--Show most used payment mnethod
SELECT pm."name",count(t."id") AS "payment_count"
FROM "payment_method" pm
JOIN "transactions" t ON t."payment_method_id" = pm."id"
GROUP BY pm."id"
ORDER BY "payment_count" DESC;

--Show amount of users money in the site
SELECT SUM("amount")
FROM "users";

--Show amount money in deleted accoutns
SELECT SUM("amount") AS "amount_sum"
FROM "users"
WHERE "deleted" = 1;

--Shwo money espent by deleted accounts
SELECT SUM(t."total_price") AS "Total_espent"
FROM "transactions" t
JOIN "orders" o ON t."order_id" = o."id"
JOIN "users" u ON u."id" = o."user_id"
WHERE u."deleted" = 1;

--Show avarenge of espend money this month per user
SELECT
    ROUND(AVG(total_gasto), 2) AS "average_spend_per_user"
FROM (
    SELECT
        u."id" AS user_id,
        SUM(t."total_price") AS total_gasto
    FROM "transactions" t
    JOIN "orders" o ON t."order_id" = o."id"
    JOIN "users" u ON u."id" = o."user_id"
    WHERE
        DATE(t."transaction_datetime") BETWEEN '2024-03-01' AND '2024-03-31'
    GROUP BY u."id"
);

-- Shows the total profit across all games in the store.
SELECT SUM("total_profit") AS "overall_profit"
FROM "profit_per_game";

--Show information from deleted users (if exist)
SELECT * FROM "users"
WHERE "deleted" = 1;

--Show games genre with most comments
SELECT ge."name" AS "genre_name",
    COUNT(gc."id") AS "total_comments"
FROM "genres" ge
JOIN "game_genres" gg ON gg."genre_id" = ge."id"
JOIN "games" g ON g."id" = gg."game_id"
JOIN "game_comments" gc ON gc."game_id" = g."id"
GROUP BY ge."id", ge."name"
ORDER BY "total_comments" DESC;

--Show games with most comments
SELECT g."name", COUNT(gc."id") AS "comments_count"
FROM "games" g
JOIN "game_comments" gc ON gc."game_id" = g."id"
GROUP BY g."id"
ORDER BY "comments_count" DESC;

--Show how many keys per status
SELECT ks."status" AS "key_status",
  COUNT(k."id") AS "keys_count"
FROM "key_status" ks
LEFT JOIN "keys" k ON k."key_status_id" = ks."id"
GROUP BY ks."id", ks."status"
ORDER BY "keys_count" DESC, ks."status";


--Show users accounts create per year
SELECT COUNT("id") AS "total_users_created",strftime('%Y',"created_at") AS "year"
FROM "users"
GROUP BY "year"
ORDER BY "year" DESC;

--Show how many sold and bought and total per game
SELECT
    g."name" AS "game_name",
    kp."total_keys",
    ms."sold_count",
    av."available_keys"
FROM "games" g
LEFT JOIN "keys_per_game" kp ON g."name" = kp."name"
LEFT JOIN "most_sold_games" ms ON g."name" = ms."name"
LEFT JOIN "available_keys_per_game" av ON g."name" = av."name"
ORDER BY "total_keys" DESC, "sold_count" DESC;

--Inserts
INSERT INTO users ("first_name","last_name","nickname","email","password","amount","role")
VALUES
('Paulo','Campos','paulo_admin','paulo.admin@keyforge.dev','kf-admin-2026', 450.50, 'admin'),  -- id 1
('Emylly','Portela','Aiko','emylly@gmail.com','123456', 320.00, 'user'),                       -- id 2
('Pedro','Henrique','Pedroca','pedro@gmail.com','123456', 150.75, 'user'),                     -- id 3
('Marcela','Mafra','little_marcela','marcela@gmail.com','123456', 290.00, 'user'),             -- id 4
('Paulo','Campos','paulo','paulo.user@keyforge.dev','kf-user-2026', 320.00, 'user');           -- id 5 (regular)

INSERT INTO genres ("name")
VALUES
('Action'),
('Adventure'),
('RPG'),
('Horror'),
('Strategy'),
('Simulation'),
('Sports'),
('Puzzle'),
('Shooter'),
('Indie'),
('Open World'),
('Racing'),
('Co-op'),
('Multiplayer'),
('Atmospheric');

INSERT INTO platforms ("name")
VALUES
('Epic Games'),
('Nintendo'),
('PlayStation'),
('Steam'),
('Xbox');

INSERT INTO key_status ("status")
VALUES
('Available'),
('Sold'),
('Refunded'),
('Expired');

-- 26 games sourced from RAWG public catalog. Platform mapping:
-- Epic Games=1, Nintendo=2, PlayStation=3, Steam=4, Xbox=5
INSERT INTO games ("active_platform_id", "name", "studio", "description", "release_date", "price", "cover_image_url", "tagline", "features", "rawg_rating")
VALUES
(4, 'Grand Theft Auto V', 'Rockstar Games', 'Sprawling open-world crime epic following three criminals through Los Santos. Three switchable protagonists, a dense single-player heist campaign, and the sprawling GTA Online metagame.', '2013-09-17', 29.99, 'https://media.rawg.io/media/games/20a/20aa03a10cda45239fe22d035c0ebe64.jpg', 'One city. Three criminals. Endless trouble.', '["Single-player","Online (30)","Cloud saves","Controller support"]', 4.47),
(4, 'The Witcher 3: Wild Hunt', 'CD Projekt Red', 'A geralt-of-rivia open-world RPG with mature, branching quests, weighty monster contracts, and one of the most respected scripts in the medium.', '2015-05-18', 39.99, 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg', 'Hunt monsters. Make impossible choices.', '["Single-player","60+ hours","4K HDR","Mod support"]', 4.66),
(4, 'Portal 2', 'Valve', 'Co-op and singleplayer puzzle masterclass. The portal gun is back, GLaDOS has friends, and the writing remains the gold standard for environmental comedy.', '2011-04-18', 9.99, 'https://media.rawg.io/media/games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg', 'Now you''re thinking with portals.', '["Single-player","Online co-op (2)","Steam Workshop","Achievements"]', 4.61),
(4, 'Tomb Raider (2013)', 'Crystal Dynamics', 'Lara''s gritty origin story. Survive a hostile island, scavenge for arrows, and watch a young archaeologist become a legend.', '2013-03-05', 19.99, 'https://media.rawg.io/media/games/021/021c4e21a1824d2526f925eff6324653.jpg', 'A survivor is born.', '["Single-player","Cloud saves","Controller support"]', 4.05),
(4, 'Counter-Strike: Global Offensive', 'Valve', 'The benchmark competitive shooter. Five-on-five tactical rounds, a rifle economy, and a community that has not stopped playing for over a decade.', '2012-08-21', 0.00, 'https://media.rawg.io/media/games/736/73619bd336c894d6941d926bfd563946.jpg', 'Aim. Communicate. Win.', '["Online (10)","Ranked","Workshop","Free-to-play"]', 3.57),
(4, 'Half-Life 2', 'Valve', 'Gordon Freeman returns. A first-person shooter that taught the medium how to handle pacing, physics, and quiet dread.', '2004-11-16', 9.99, 'https://media.rawg.io/media/games/b8c/b8c243eaa0fbac8115e0cdccac3f91dc.jpg', 'The right man in the wrong place.', '["Single-player","Steam Workshop","Steam Deck verified"]', 4.49),
(4, 'Red Dead Redemption 2', 'Rockstar Games', 'An end-of-the-Old-West epic. Ride with the Van der Linde gang as the world they belong to disappears around them.', '2018-10-26', 59.99, 'https://media.rawg.io/media/games/511/5118aff5091cb3efec399c808f8c598f.jpg', 'An outlaw for life.', '["Single-player","Online (30)","4K HDR","Cloud saves"]', 4.59),
(4, 'Left 4 Dead 2', 'Valve', 'Four-player co-op zombie shooter that still anchors the genre. Special infected, dynamic AI director, and the best campaign chemistry in any shooter.', '2009-11-17', 9.99, 'https://media.rawg.io/media/games/d58/d588947d4286e7b5e0e12e1bea7d9844.jpg', 'Reach the safe house. Together.', '["Online co-op (4)","Versus","Steam Workshop"]', 4.10),
(4, 'Borderlands 2', 'Gearbox Software', 'Looter-shooter at its loudest. Bazillions of guns, cel-shaded mayhem, and a script that holds up.', '2012-09-18', 19.99, 'https://media.rawg.io/media/games/49c/49c3dfa4ce2f6f140cc4825868e858cb.jpg', '87 bazillion guns and counting.', '["Online co-op (4)","Single-player","Cloud saves"]', 4.03),
(4, 'BioShock Infinite', 'Irrational Games', 'Columbia, a city in the clouds. A first-person narrative shooter that wrestles with American mythology and quantum guilt.', '2013-03-26', 14.99, 'https://media.rawg.io/media/games/fc1/fc1307a2774506b5bd65d7e8424664a7.jpg', 'Bring us the girl, and wipe away the debt.', '["Single-player","Cloud saves","Achievements"]', 4.37),
(1, 'Life is Strange', 'Dontnod Entertainment', 'Episodic narrative adventure about a teenager who discovers she can rewind time. Photography, friendship, and consequences.', '2015-01-29', 19.99, 'https://media.rawg.io/media/games/562/562553814dd54e001a541e4ee83a591c.jpg', 'Every choice rewinds.', '["Single-player","Episodic","Achievements"]', 4.11),
(4, 'BioShock', 'Irrational Games', 'Welcome to Rapture. An immersive-sim shooter set in a failed underwater objectivist utopia. Defines a generation of narrative FPS.', '2007-08-21', 14.99, 'https://media.rawg.io/media/games/bc0/bc06a29ceac58652b684deefe7d56099.jpg', 'Would you kindly?', '["Single-player","Cloud saves"]', 4.38),
(3, 'Destiny 2', 'Bungie', 'Online shooter MMO. Drop into shared worlds, build a Guardian, and chase god-roll loot through expansive seasonal stories.', '2017-09-06', 0.00, 'https://media.rawg.io/media/games/34b/34b1f1850a1c06fd971bc6ab3ac0ce0e.jpg', 'Become legend.', '["Online (6)","Crossplay","Free-to-play"]', 3.59),
(3, 'God of War (2018)', 'Santa Monica Studio', 'Kratos and his son Atreus journey through the Norse realms. Single-camera cinematography, axe-throwing combat, and the best dad-game ever made.', '2018-04-20', 49.99, 'https://media.rawg.io/media/games/4be/4be6a6ad0364751a96229c56bf69be59.jpg', 'Boy.', '["Single-player","4K HDR","DualSense haptics"]', 4.55),
(4, 'Fallout 4', 'Bethesda Game Studios', 'Post-nuclear Boston open-world RPG. Build settlements, modify weapons, and do whatever a Sole Survivor wants to do.', '2015-11-09', 29.99, 'https://media.rawg.io/media/games/d82/d82990b9c67ba0d2d09d4e6fa88885a7.jpg', 'War. War never changes.', '["Single-player","Mod support","Cloud saves"]', 3.80),
(4, 'Limbo', 'Playdead', 'A monochrome side-scrolling puzzle-platformer about a boy searching for his sister. Unforgettable silhouettes and brutal physics puzzles.', '2010-07-21', 9.99, 'https://media.rawg.io/media/games/942/9424d6bb763dc38d9378b488603c87fa.jpg', 'Uncertain of his sister''s fate.', '["Single-player","Steam Deck verified"]', 4.15),
(1, 'PAYDAY 2', 'Overkill Software', 'Four-player co-op heist shooter. Plan the job, mask up, and improvise when it inevitably goes loud.', '2013-08-13', 9.99, 'https://media.rawg.io/media/games/73e/73eecb8909e0c39fb246f457b5d6cbbe.jpg', 'Crime pays.', '["Online co-op (4)","Workshop","Crossplay"]', 3.51),
(4, 'Team Fortress 2', 'Valve', 'Class-based hat economy with a multiplayer shooter attached. Nine classes, infinite cosmetic depth, and decade-long memes.', '2007-10-10', 0.00, 'https://media.rawg.io/media/games/46d/46d98e6910fbc0706e2948a7cc9b10c5.jpg', 'Nine classes. Infinite hats.', '["Online (12+)","Workshop","Free-to-play"]', 4.07),
(4, 'Minecraft', 'Mojang Studios', 'Place blocks. Mine blocks. Survive the night. The most successful sandbox game ever made.', '2009-05-10', 26.95, 'https://media.rawg.io/media/games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg', 'Build anything.', '["Single-player","Online (8)","Modding","Cross-play"]', 4.42),
(4, 'Rocket League', 'Psyonix', 'Cars. Soccer. Rocket boosters. Twelve seconds to read a play and ten more to score. Still the cleanest pick-up-and-play multiplayer on PC.', '2015-07-07', 0.00, 'https://media.rawg.io/media/games/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg', 'Cars. Soccer. Rockets.', '["Online (8)","Cross-platform","Free-to-play","Local co-op"]', 3.93),
(4, 'DOOM (2016)', 'id Software', 'Reboot of the genre''s progenitor. Glory kills, push-forward combat, and the most aggressive heavy-metal score in any shooter.', '2016-05-13', 19.99, 'https://media.rawg.io/media/games/c4b/c4b0cab189e73432de3a250d8cf1c84e.jpg', 'Rip and tear.', '["Single-player","Multiplayer","SnapMap editor"]', 4.39),
(4, 'Bloodborne', 'FromSoftware', 'Gothic action-RPG set in the cursed city of Yharnam. Trick weapons, blood echoes, and a soundtrack that will live in your head.', '2015-03-24', 19.99, 'https://media.rawg.io/media/games/214/214b29aeff13a0ae6a70fc4426e85991.jpg', 'A hunt by night.', '["Single-player","Online co-op","PvP"]', 4.49),
(3, 'Horizon Zero Dawn', 'Guerrilla Games', 'Post-post-apocalyptic open-world action-RPG. Mechanical wildlife, tribal politics, and one of the most striking art directions of its console generation.', '2017-02-28', 49.99, 'https://media.rawg.io/media/games/b7d/b7d3f1715fa8381a4e780173a197a615.jpg', 'In a world overrun by machines.', '["Single-player","4K HDR","Photo mode"]', 4.27),
(4, 'Mass Effect 2', 'BioWare', 'Space-opera RPG. Assemble a crew, romance an alien, save the galaxy. The companion writing is still unmatched.', '2010-01-26', 19.99, 'https://media.rawg.io/media/games/5c0/5c0dd63002cb23f804aab327d40ef119.jpg', 'Assemble the crew.', '["Single-player","Cloud saves","DLC included"]', 4.42),
(4, 'Hollow Knight', 'Team Cherry', 'Hand-drawn 2D Metroidvania set in the ruined kingdom of Hallownest. Explore twisting caverns, fight haunting bosses, and uncover the kingdom''s mysteries with a tiny knight and a battered nail.', '2017-02-23', 14.99, 'https://media.rawg.io/media/games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg', 'Forge your own path.', '["Single-player","Controller support","Cloud saves","Steam Deck verified"]', 4.40),
(4, 'Hollow Knight: Silksong', 'Team Cherry', 'The long-awaited sequel. Play as Hornet, princess-protector of Hallownest, ascending a haunted kingdom of silk and song. Faster combat, new tools, and a brand-new world to unravel.', '2025-09-04', 19.99, 'https://media.rawg.io/media/games/27c/27cd8b7dead05a870f8a514a9a1915ad.jpg', 'Ascend a haunted kingdom.', '["Single-player","Controller support","Cloud saves","60+ hours"]', 4.38);

INSERT INTO suppliers ("platform_id", "name", "website", "contact_email")
VALUES
(4, 'Humble Bundle', 'https://humblebundle.com', 'partners@humblebundle.com'),
(3, 'PlayStation Store', 'https://store.playstation.com', 'publishing@sony.com'),
(2, 'Nintendo eShop', 'https://nintendo.com', 'developer@nintendo.com'),
(1, 'Epic Games Publishing', 'https://epicgames.com', 'dev-support@epicgames.com');

-- Genre IDs: 1=Action, 2=Adventure, 3=RPG, 4=Horror, 5=Strategy, 6=Simulation,
-- 7=Sports, 8=Puzzle, 9=Shooter, 10=Indie, 11=Open World, 12=Racing,
-- 13=Co-op, 14=Multiplayer, 15=Atmospheric
INSERT INTO game_genres ("game_id", "genre_id")
VALUES
-- 1 GTA V (Action, Adventure, Open World)
(1, 1), (1, 2), (1, 11),
-- 2 The Witcher 3 (RPG, Action, Adventure)
(2, 3), (2, 1), (2, 2),
-- 3 Portal 2 (Puzzle, Shooter, Co-op)
(3, 8), (3, 9), (3, 13),
-- 4 Tomb Raider (Action, Adventure)
(4, 1), (4, 2),
-- 5 CS:GO (Shooter, Multiplayer)
(5, 9), (5, 14),
-- 6 Half-Life 2 (Shooter, Action, Atmospheric)
(6, 9), (6, 1), (6, 15),
-- 7 RDR2 (Adventure, Action, Open World)
(7, 2), (7, 1), (7, 11),
-- 8 Left 4 Dead 2 (Shooter, Co-op)
(8, 9), (8, 13),
-- 9 Borderlands 2 (Action, Shooter, RPG)
(9, 1), (9, 9), (9, 3),
-- 10 BioShock Infinite (Shooter, Adventure, Atmospheric)
(10, 9), (10, 2), (10, 15),
-- 11 Life is Strange (Adventure, Indie)
(11, 2), (11, 10),
-- 12 BioShock (Shooter, Adventure, Atmospheric)
(12, 9), (12, 2), (12, 15),
-- 13 Destiny 2 (Shooter, Multiplayer)
(13, 9), (13, 14),
-- 14 God of War 2018 (Action, Adventure)
(14, 1), (14, 2),
-- 15 Fallout 4 (Action, RPG, Open World)
(15, 1), (15, 3), (15, 11),
-- 16 Limbo (Puzzle, Indie, Atmospheric)
(16, 8), (16, 10), (16, 15),
-- 17 PAYDAY 2 (Shooter, Action, Co-op)
(17, 9), (17, 1), (17, 13),
-- 18 Team Fortress 2 (Shooter, Multiplayer)
(18, 9), (18, 14),
-- 19 Minecraft (Adventure, Indie, Simulation)
(19, 2), (19, 10), (19, 6),
-- 20 Rocket League (Sports, Racing, Indie)
(20, 7), (20, 12), (20, 10),
-- 21 DOOM 2016 (Shooter, Action)
(21, 9), (21, 1),
-- 22 Bloodborne (Action, RPG, Atmospheric)
(22, 1), (22, 3), (22, 15),
-- 23 Horizon Zero Dawn (Action, RPG, Open World)
(23, 1), (23, 3), (23, 11),
-- 24 Mass Effect 2 (RPG, Adventure, Shooter)
(24, 3), (24, 2), (24, 9),
-- 25 Hollow Knight (Action, Indie, Atmospheric)
(25, 1), (25, 10), (25, 15),
-- 26 Silksong (Action, Adventure, Indie)
(26, 1), (26, 2), (26, 10);

-- One supplier batch per game (matches the design's data layer pattern).
INSERT INTO key_batches ("game_id", "supplier_id", "unit_price", "quantity", "purchase_date")
VALUES
(1, 1, 12.50, 60, '2024-09-15'),
(2, 1, 16.00, 50, '2024-08-20'),
(3, 1, 4.00, 40, '2024-07-12'),
(4, 1, 8.00, 35, '2024-09-02'),
(5, 1, 0.00, 80, '2024-06-10'),
(6, 1, 4.00, 45, '2024-05-18'),
(7, 1, 24.00, 40, '2024-10-05'),
(8, 1, 4.00, 50, '2024-07-22'),
(9, 1, 8.00, 35, '2024-08-03'),
(10, 1, 6.00, 30, '2024-09-29'),
(11, 4, 8.00, 25, '2024-08-12'),
(12, 1, 6.00, 30, '2024-10-15'),
(13, 2, 0.00, 60, '2024-07-30'),
(14, 2, 20.00, 40, '2024-09-10'),
(15, 1, 12.00, 35, '2024-08-25'),
(16, 1, 4.00, 30, '2024-06-19'),
(17, 4, 4.00, 35, '2024-10-08'),
(18, 1, 0.00, 50, '2024-06-25'),
(19, 1, 11.00, 60, '2024-09-18'),
(20, 1, 0.00, 80, '2024-08-05'),
(21, 1, 8.00, 30, '2024-07-15'),
(22, 1, 8.00, 30, '2024-09-22'),
(23, 2, 20.00, 35, '2024-10-12'),
(24, 1, 8.00, 30, '2024-09-08'),
(25, 1, 6.00, 50, '2024-08-30'),
(26, 1, 8.00, 40, '2024-09-30');

-- 4 keys per game (mostly Available, some Sold for variety).
-- key IDs assigned sequentially 1..N — used by order_keys below.
INSERT INTO keys ("game_id", "batch_id", "key_status_id", "key_code") VALUES
(1, 1, 1, 'GTA5-A001-K0001'), (1, 1, 1, 'GTA5-A002-K0002'), (1, 1, 1, 'GTA5-A003-K0003'), (1, 1, 1, 'GTA5-S004-K0004'),
(2, 2, 1, 'TW3-B001-K0005'),  (2, 2, 1, 'TW3-B002-K0006'),  (2, 2, 1, 'TW3-B003-K0007'),  (2, 2, 1, 'TW3-S004-K0008'),
(3, 3, 1, 'PRT2-A001-K0009'), (3, 3, 1, 'PRT2-A002-K0010'), (3, 3, 1, 'PRT2-A003-K0011'), (3, 3, 1, 'PRT2-S004-K0012'),
(4, 4, 1, 'TR13-A001-K0013'), (4, 4, 1, 'TR13-A002-K0014'), (4, 4, 1, 'TR13-A003-K0015'), (4, 4, 1, 'TR13-S004-K0016'),
(5, 5, 4, 'CSGO-X001-K0017'), (5, 5, 4, 'CSGO-X002-K0018'), (5, 5, 4, 'CSGO-X003-K0019'), (5, 5, 4, 'CSGO-X004-K0020'),
(6, 6, 1, 'HL2-A001-K0021'),  (6, 6, 1, 'HL2-A002-K0022'),  (6, 6, 1, 'HL2-A003-K0023'),  (6, 6, 1, 'HL2-S004-K0024'),
(7, 7, 1, 'RDR2-A001-K0025'), (7, 7, 1, 'RDR2-A002-K0026'), (7, 7, 1, 'RDR2-A003-K0027'), (7, 7, 1, 'RDR2-S004-K0028'),
(8, 8, 1, 'L4D2-A001-K0029'), (8, 8, 1, 'L4D2-A002-K0030'), (8, 8, 1, 'L4D2-A003-K0031'), (8, 8, 1, 'L4D2-S004-K0032'),
(9, 9, 1, 'BL2-A001-K0033'),  (9, 9, 1, 'BL2-A002-K0034'),  (9, 9, 1, 'BL2-A003-K0035'),  (9, 9, 1, 'BL2-S004-K0036'),
(10, 10, 1, 'BSI-A001-K0037'),(10, 10, 1, 'BSI-A002-K0038'),(10, 10, 1, 'BSI-A003-K0039'),(10, 10, 1, 'BSI-S004-K0040'),
(11, 11, 1, 'LIS-A001-K0041'),(11, 11, 1, 'LIS-A002-K0042'),(11, 11, 1, 'LIS-A003-K0043'),(11, 11, 1, 'LIS-S004-K0044'),
(12, 12, 1, 'BSK-A001-K0045'),(12, 12, 1, 'BSK-A002-K0046'),(12, 12, 1, 'BSK-A003-K0047'),(12, 12, 1, 'BSK-S004-K0048'),
(13, 13, 1, 'D2-A001-K0049'), (13, 13, 1, 'D2-A002-K0050'), (13, 13, 1, 'D2-A003-K0051'), (13, 13, 1, 'D2-S004-K0052'),
(14, 14, 1, 'GOW4-A001-K0053'),(14, 14, 1, 'GOW4-A002-K0054'),(14, 14, 1, 'GOW4-A003-K0055'),(14, 14, 1, 'GOW4-S004-K0056'),
(15, 15, 1, 'FO4-A001-K0057'),(15, 15, 1, 'FO4-A002-K0058'),(15, 15, 1, 'FO4-A003-K0059'),(15, 15, 1, 'FO4-S004-K0060'),
(16, 16, 1, 'LMB-A001-K0061'),(16, 16, 1, 'LMB-A002-K0062'),(16, 16, 1, 'LMB-A003-K0063'),(16, 16, 1, 'LMB-S004-K0064'),
(17, 17, 1, 'PD2-A001-K0065'),(17, 17, 1, 'PD2-A002-K0066'),(17, 17, 1, 'PD2-A003-K0067'),(17, 17, 1, 'PD2-S004-K0068'),
(18, 18, 4, 'TF2-X001-K0069'),(18, 18, 4, 'TF2-X002-K0070'),(18, 18, 4, 'TF2-X003-K0071'),(18, 18, 4, 'TF2-X004-K0072'),
(19, 19, 1, 'MC-A001-K0073'), (19, 19, 1, 'MC-A002-K0074'), (19, 19, 1, 'MC-A003-K0075'), (19, 19, 1, 'MC-S004-K0076'),
(20, 20, 1, 'RL-A001-K0077'), (20, 20, 1, 'RL-A002-K0078'), (20, 20, 1, 'RL-A003-K0079'), (20, 20, 1, 'RL-S004-K0080'),
(21, 21, 1, 'DM16-A001-K0081'),(21, 21, 1, 'DM16-A002-K0082'),(21, 21, 1, 'DM16-A003-K0083'),(21, 21, 1, 'DM16-S004-K0084'),
(22, 22, 1, 'BB-A001-K0085'), (22, 22, 1, 'BB-A002-K0086'), (22, 22, 1, 'BB-A003-K0087'), (22, 22, 1, 'BB-S004-K0088'),
(23, 23, 1, 'HZD-A001-K0089'),(23, 23, 1, 'HZD-A002-K0090'),(23, 23, 1, 'HZD-A003-K0091'),(23, 23, 1, 'HZD-S004-K0092'),
(24, 24, 1, 'ME2-A001-K0093'),(24, 24, 1, 'ME2-A002-K0094'),(24, 24, 1, 'ME2-A003-K0095'),(24, 24, 1, 'ME2-S004-K0096'),
(25, 25, 1, 'HK-A001-K0097'), (25, 25, 1, 'HK-A002-K0098'), (25, 25, 1, 'HK-A003-K0099'), (25, 25, 1, 'HK-S004-K0100'),
(26, 26, 1, 'SS-A001-K0101'), (26, 26, 1, 'SS-A002-K0102'), (26, 26, 1, 'SS-A003-K0103'), (26, 26, 1, 'SS-S004-K0104');

INSERT INTO orders ("user_id", "purchase_datetime")
VALUES
(1, '2026-01-15 14:30:00'),
(2, '2026-02-02 10:15:00'),
(3, '2026-02-18 16:45:00'),
(4, '2026-03-04 20:20:00'),
(1, '2026-03-10 09:00:00'),
(2, '2026-03-22 11:30:00'),
(3, '2026-04-01 15:00:00'),
(4, '2026-04-15 18:00:00'),
(1, '2026-04-25 12:00:00'),
(2, '2026-05-02 19:30:00');

INSERT INTO payment_method ("name")
VALUES
('Wallet'),
('Credit Card'),
('Debit Card'),
('PayPal'),
('PIX');

-- order_keys reference the *Sold* keys (status_id=2) so admin views are consistent.
INSERT INTO order_keys ("order_id", "key_id", "unit_price")
VALUES
(1, 4,  29.99),    -- GTA V
(2, 8,  39.99),    -- Witcher 3
(3, 12, 9.99),     -- Portal 2
(4, 16, 19.99),    -- Tomb Raider
(5, 28, 59.99),    -- RDR 2
(6, 32, 9.99),     -- Left 4 Dead 2
(7, 56, 49.99),    -- God of War (2018)
(8, 60, 29.99),    -- Fallout 4
(9, 76, 26.95),    -- Minecraft
(10, 100, 14.99);  -- Hollow Knight

INSERT INTO transactions ("order_id", "payment_method_id", "total_price", "transaction_datetime")
VALUES
(1, 1, 29.99, '2026-01-15 14:32:00'),
(2, 4, 39.99, '2026-02-02 10:18:00'),
(3, 2, 9.99,  '2026-02-18 16:47:00'),
(4, 3, 19.99, '2026-03-04 20:25:00'),
(5, 5, 59.99, '2026-03-10 09:05:00'),
(6, 2, 9.99,  '2026-03-22 11:35:00'),
(7, 5, 49.99, '2026-04-01 15:10:00'),
(8, 4, 29.99, '2026-04-15 18:05:00'),
(9, 3, 26.95, '2026-04-25 12:15:00'),
(10, 2, 14.99,'2026-05-02 19:35:00');

INSERT INTO wishlist ("user_id", "game_id")
VALUES
(1, 7),   -- RDR 2
(1, 14),  -- God of War (2018)
(2, 25),  -- Hollow Knight
(2, 26),  -- Silksong
(3, 22),  -- Bloodborne
(3, 6),   -- Half-Life 2
(4, 11),  -- Life is Strange
(4, 2),   -- Witcher 3
(1, 21),  -- DOOM
(2, 3);   -- Portal 2

INSERT INTO game_comments ("user_id", "game_id", "comment_text")
VALUES
(1, 2,  'Hours just disappeared. The Bloody Baron quest alone is worth the entry.'),
(3, 2,  'Came for monsters, stayed for the writing. Hearts of Stone is a masterpiece.'),
(2, 1,  'Online still surprisingly active in 2026. Single-player heists hold up.'),
(4, 3,  'Best co-op puzzle game ever made. Period.'),
(1, 14, 'Boy. Boy. BOY. Combat feel is unreal.'),
(2, 7,  'Slowest game I have ever loved. Riding into a sunset has never hit harder.'),
(3, 22, 'Yharnam ate me alive. Trick weapons are the best in the genre.'),
(4, 21, 'Push-forward combat plus that soundtrack — I have not stopped grinning.'),
(1, 6,  'Still the best opening level of any FPS, twenty years on.'),
(2, 11, 'Made me cry on a bus. The score is half of why this game works.'),
(3, 19, 'Bought it for my kid. Now I play after they go to sleep.'),
(4, 24, 'Loyalty missions are the gold standard for character writing in games.'),
(1, 16, 'Three hours, no dialogue, ten years of nightmares. Worth every cent.'),
(2, 25, 'Hand-drawn art and tight controls. A modern classic.');

INSERT INTO game_rating ("user_id", "game_id", "rating")
VALUES
(1, 1,  9.0),
(1, 2,  9.5),
(2, 7,  9.4),
(3, 14, 9.3),
(4, 22, 9.2),
(2, 25, 9.1),
(3, 6,  9.0),
(4, 21, 8.9),
(1, 3,  9.5),
(2, 11, 8.7),
(3, 24, 8.9),
(4, 16, 8.8);

INSERT INTO game_price_log ("game_id", "old_price", "new_price")
VALUES
(1, 39.99, 29.99),   -- GTA V dropped
(2, 49.99, 39.99),   -- Witcher 3
(7, 69.99, 59.99),   -- RDR 2
(14, 59.99, 49.99),  -- God of War
(15, 39.99, 29.99),  -- Fallout 4
(21, 29.99, 19.99),  -- DOOM
(23, 59.99, 49.99),  -- Horizon
(25, 19.99, 14.99);  -- Hollow Knight

-- ── RAWG expansion (47 paid games, ids 27-73) ──
INSERT INTO games ("active_platform_id","name","studio","description","release_date","price","cover_image_url","tagline","features","rawg_rating") VALUES

(4,'Middle-earth: Shadow of Mordor','Indie Studios','Build, choose, become legend.','2014-09-30',43.49,'https://media.rawg.io/media/games/d1a/d1a2e99ade53494c6330a0ed945fe823.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',3.91),
(4,'Half-Life 2: Lost Coast','Neon Forge','Strike fast, strike clean.','2005-10-27',26.99,'https://media.rawg.io/media/games/b7b/b7b8381707152afc7d91f5d95de70e39.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.45),
(4,'The Walking Dead: Season 1','Crown Games','Strike fast, strike clean.','2012-04-23',51.19,'https://media.rawg.io/media/games/8d6/8d69eb6c32ed6acfd75f82d532144993.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.36),
(3,'Little Nightmares','Bluewave','Strike fast, strike clean.','2017-04-27',39.09,'https://media.rawg.io/media/games/8a0/8a02f84a5916ede2f923b88d5f8217ba.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.04),
(3,'BioShock 2','Helix Studio','Aim. Squeeze. Reload.','2010-02-09',46.79,'https://media.rawg.io/media/games/157/15742f2f67eacff546738e1ab5c19d20.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.07),
(4,'Half-Life','North Sky','Aim. Squeeze. Reload.','1998-11-19',55.59,'https://media.rawg.io/media/games/6c5/6c55e22185876626881b76c11922b073.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.37),
(4,'Half-Life 2: Episode One','Polaris Lab','Aim. Squeeze. Reload.','2006-06-01',45.69,'https://media.rawg.io/media/games/7a2/7a2500ee8b2c0e1ff268bb4479463dea.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.38),
(4,'Half-Life 2: Episode Two','Aurora Works','Aim. Squeeze. Reload.','2007-10-10',48.99,'https://media.rawg.io/media/games/198/1988a337305e008b41d7f536ce9b73f6.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.46),
(4,'Half-Life 2: Deathmatch','Thornwood','Strike fast, strike clean.','2004-11-01',26.99,'https://media.rawg.io/media/games/ec3/ec3a7db7b8ab5a71aad622fe7c62632f.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.29),
(5,'Dark Souls III','Quartz Lab','Build, choose, become legend.','2016-04-11',47.89,'https://media.rawg.io/media/games/da1/da1b267764d77221f07a4386b6548e5a.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.4),
(2,'Stardew Valley','Indie Studios','Build, choose, become legend.','2016-02-25',47.89,'https://media.rawg.io/media/games/713/713269608dc8f2f40f5a670a14b2de94.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.39),
(3,'BioShock Remastered','Neon Forge','Aim. Squeeze. Reload.','2016-09-15',26.99,'https://media.rawg.io/media/games/be0/be01c3d7d8795a45615da139322ca080.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.24),
(5,'Mirror''s Edge','Crown Games','Strike fast, strike clean.','2008-11-11',39.09,'https://media.rawg.io/media/games/8e4/8e4de3f54ac659e08a7ba6a2b731682a.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.07),
(4,'Hotline Miami','Bluewave','Aim. Squeeze. Reload.','2012-10-22',43.49,'https://media.rawg.io/media/games/9fa/9fa63622543e5d4f6d99aa9d73b043de.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.38),
(3,'Hitman','Helix Studio','Aim. Squeeze. Reload.','2016-03-11',41.29,'https://media.rawg.io/media/games/16b/16b1b7b36e2042d1128d5a3e852b3b2f.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',3.93),
(4,'Outlast','North Sky','Strike fast, strike clean.','2013-09-03',37.99,'https://media.rawg.io/media/games/9dd/9ddabb34840ea9227556670606cf8ea3.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.75),
(5,'Far Cry 3','Polaris Lab','Aim. Squeeze. Reload.','2012-11-28',46.79,'https://media.rawg.io/media/games/15c/15c95a4915f88a3e89c821526afe05fc.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.26),
(4,'Deus Ex: Mankind Divided','Aurora Works','Build, choose, become legend.','2016-08-22',41.29,'https://media.rawg.io/media/games/00d/00d374f12a3ab5f96c500a2cfa901e15.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',3.96),
(4,'PlayerUnknown’s Battlegrounds','Thornwood','Aim. Squeeze. Reload.','2017-12-20',39.09,'https://media.rawg.io/media/games/1bd/1bd2657b81eb0c99338120ad444b24ff.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',3.27),
(5,'Path of Exile','Quartz Lab','Build, choose, become legend.','2013-10-23',44.59,'https://media.rawg.io/media/games/d0f/d0f91fe1d92332147e5db74e207cfc7a.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',3.65),
(5,'Alan Wake','Indie Studios','Aim. Squeeze. Reload.','2010-05-14',41.29,'https://media.rawg.io/media/games/5c0/5c0dd63002cb23f804aab327d40ef119.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.09),
(3,'Marvel''s Spider-Man','Neon Forge','Strike fast, strike clean.','2018-09-07',45.69,'https://media.rawg.io/media/games/9aa/9aa42d16d425fa6f179fc9dc2f763647.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.45),
(5,'Wolfenstein: The New Order','Crown Games','Aim. Squeeze. Reload.','2014-05-19',39.09,'https://media.rawg.io/media/games/c80/c80bcf321da44d69b18a06c04d942662.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.18),
(4,'Detroit: Become Human','Bluewave','Strike fast, strike clean.','2018-05-25',36.89,'https://media.rawg.io/media/games/951/951572a3dd1e42544bd39a5d5b42d234.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.34),
(4,'Garry''s Mod','Helix Studio','Strike fast, strike clean.','2004-12-24',26.99,'https://media.rawg.io/media/games/48c/48cb04ca483be865e3a83119c94e6097.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.81),
(4,'Amnesia: The Dark Descent','North Sky','Strike fast, strike clean.','2010-09-08',43.49,'https://media.rawg.io/media/games/b54/b54598d1d5cc31899f4f0a7e3122a7b0.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.65),
(5,'Spec Ops: The Line','Polaris Lab','Aim. Squeeze. Reload.','2012-06-26',33.59,'https://media.rawg.io/media/games/b49/b4912b5dbfc7ed8927b65f05b8507f6c.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.1),
(4,'Half-Life Deathmatch: Source','Aurora Works','Strike fast, strike clean.','2006-05-01',26.99,'https://media.rawg.io/media/games/174/174fabfca02d5730531bab2153a7dfcb.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.21),
(4,'Saints Row: The Third','Thornwood','Strike fast, strike clean.','2011-11-15',42.39,'https://media.rawg.io/media/games/d69/d69810315bd7e226ea2d21f9156af629.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.95),
(5,'Prey','Quartz Lab','Build, choose, become legend.','2017-05-05',37.99,'https://media.rawg.io/media/games/e6d/e6de699bd788497f4b52e2f41f9698f2.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.28),
(5,'Fallout: New Vegas','Indie Studios','Build, choose, become legend.','2010-10-19',42.39,'https://media.rawg.io/media/games/995/9951d9d55323d08967640f7b9ab3e342.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.43),
(4,'Borderlands','Neon Forge','Build, choose, become legend.','2009-10-20',39.09,'https://media.rawg.io/media/games/c6b/c6bfece1daf8d06bc0a60632ac78e5bf.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',3.82),
(3,'The Elder Scrolls V: Skyrim Special Edition','Crown Games','Build, choose, become legend.','2016-10-27',31.39,'https://media.rawg.io/media/games/62c/62c7c8b28a27b83680b22fb9d33fc619.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.45),
(5,'Dishonored 2','Bluewave','Build, choose, become legend.','2016-11-10',44.59,'https://media.rawg.io/media/games/f6b/f6bed028b02369d4cab548f4f9337e81.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.26),
(3,'Dishonored','Helix Studio','Build, choose, become legend.','2012-09-25',50.09,'https://media.rawg.io/media/games/4e6/4e6e8e7f50c237d76f38f3c885dae3d2.jpg','Build, choose, become legend.','["Single-player","Cloud saves"]',4.38),
(4,'Don''t Starve Together','North Sky','Strike fast, strike clean.','2016-04-21',41.29,'https://media.rawg.io/media/games/dd5/dd50d4266915d56dd5b63ae1bf72606a.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.77),
(5,'Hellblade: Senua''s Sacrifice','Polaris Lab','Strike fast, strike clean.','2017-08-07',41.29,'https://media.rawg.io/media/games/63f/63f0e68688cad279ed38cde931dbfcdb.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.22),
(4,'Grand Theft Auto: Vice City','Aurora Works','Strike fast, strike clean.','2002-10-27',53.39,'https://media.rawg.io/media/games/13a/13a528ac9cf48bbb6be5d35fe029336d.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.44),
(4,'Company of Heroes 2','Thornwood','Outthink the opposition.','2013-06-25',37.99,'https://media.rawg.io/media/games/0bd/0bd5646a3d8ee0ac3314bced91ea306d.jpg','Outthink the opposition.','["Single-player","Cloud saves"]',3.1),
(3,'Injustice: Gods Among Us Ultimate Edition','Quartz Lab','Strike fast, strike clean.','2013-11-12',37.99,'https://media.rawg.io/media/games/234/23410661770ae13eac11066980834367.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.53),
(5,'Assassin’s Creed IV: Black Flag','Indie Studios','Strike fast, strike clean.','2013-10-29',43.49,'https://media.rawg.io/media/games/849/849414b978db37d4563ff9e4b0d3a787.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.16),
(3,'Hitman: Absolution','Neon Forge','Aim. Squeeze. Reload.','2012-11-19',36.89,'https://media.rawg.io/media/games/d46/d46373f39458670305704ef089387520.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',3.76),
(4,'Sid Meier''s Civilization V','Crown Games','Outthink the opposition.','2010-09-21',48.99,'https://media.rawg.io/media/games/55e/55ee6432ac2bf224610fa17e4c652107.jpg','Outthink the opposition.','["Single-player","Cloud saves"]',4.29),
(5,'Control','Bluewave','Aim. Squeeze. Reload.','2019-08-27',42.39,'https://media.rawg.io/media/games/253/2534a46f3da7fa7c315f1387515ca393.jpg','Aim. Squeeze. Reload.','["Single-player","Cloud saves"]',4.14),
(3,'L.A. Noire','Helix Studio','Strike fast, strike clean.','2011-05-17',41.29,'https://media.rawg.io/media/games/e2d/e2d3f396b16dded0f841c17c9799a882.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',4.16),
(4,'Super Meat Boy','North Sky','Hand-crafted by a small team.','2010-10-20',45.69,'https://media.rawg.io/media/games/e04/e04963f3ac4c4fa83a1dc0b9231e50db.jpg','Hand-crafted by a small team.','["Single-player","Cloud saves"]',3.98),
(5,'For Honor','Polaris Lab','Strike fast, strike clean.','2017-02-13',33.59,'https://media.rawg.io/media/games/4e0/4e0e7b6d6906a131307c94266e5c9a1c.jpg','Strike fast, strike clean.','["Single-player","Cloud saves"]',3.3);

INSERT INTO game_genres ("game_id","genre_id") VALUES

(27,1),
(27,3),
(28,1),
(29,1),
(29,2),
(30,1),
(30,2),
(31,1),
(31,9),
(32,1),
(32,9),
(33,1),
(33,9),
(34,1),
(34,9),
(34,8),
(35,1),
(36,1),
(36,3),
(37,3),
(37,6),
(37,10),
(38,9),
(39,1),
(40,1),
(40,9),
(41,1),
(41,9),
(41,6),
(42,1),
(42,10),
(43,1),
(43,9),
(44,1),
(44,3),
(45,1),
(45,9),
(45,14),
(46,1),
(46,3),
(46,14),
(47,1),
(47,9),
(47,2),
(48,1),
(49,1),
(49,9),
(50,1),
(50,2),
(51,1),
(51,2),
(51,6),
(52,1),
(52,2),
(52,10),
(53,1),
(53,9),
(54,1),
(55,1),
(55,2),
(56,1),
(56,9),
(56,3),
(57,1),
(57,9),
(57,3),
(58,1),
(58,9),
(58,3),
(59,1),
(59,3),
(60,1),
(60,3),
(61,1),
(61,2),
(61,3),
(62,1),
(62,6),
(62,10),
(63,1),
(63,2),
(63,10),
(64,1),
(65,5),
(66,1),
(67,1),
(68,1),
(68,9),
(69,5),
(70,1),
(70,9),
(70,2),
(71,1),
(71,2),
(72,10),
(72,2),
(73,1),
(73,14);

INSERT INTO key_batches ("game_id","supplier_id","unit_price","quantity","purchase_date") VALUES

(27,1,19.57,30,'2024-09-01'),
(28,1,12.15,31,'2024-09-01'),
(29,1,23.04,32,'2024-09-01'),
(30,1,17.59,33,'2024-09-01'),
(31,1,21.06,34,'2024-09-01'),
(32,1,25.02,35,'2024-09-01'),
(33,1,20.56,36,'2024-09-01'),
(34,1,22.05,37,'2024-09-01'),
(35,1,12.15,38,'2024-09-01'),
(36,1,21.55,39,'2024-09-01'),
(37,1,21.55,40,'2024-09-01'),
(38,1,12.15,41,'2024-09-01'),
(39,1,17.59,42,'2024-09-01'),
(40,1,19.57,43,'2024-09-01'),
(41,1,18.58,44,'2024-09-01'),
(42,1,17.1,45,'2024-09-01'),
(43,1,21.06,46,'2024-09-01'),
(44,1,18.58,47,'2024-09-01'),
(45,1,17.59,48,'2024-09-01'),
(46,1,20.07,49,'2024-09-01'),
(47,1,18.58,50,'2024-09-01'),
(48,1,20.56,51,'2024-09-01'),
(49,1,17.59,52,'2024-09-01'),
(50,1,16.6,53,'2024-09-01'),
(51,1,12.15,54,'2024-09-01'),
(52,1,19.57,55,'2024-09-01'),
(53,1,15.12,56,'2024-09-01'),
(54,1,12.15,57,'2024-09-01'),
(55,1,19.08,58,'2024-09-01'),
(56,1,17.1,59,'2024-09-01'),
(57,1,19.08,30,'2024-09-01'),
(58,1,17.59,31,'2024-09-01'),
(59,1,14.13,32,'2024-09-01'),
(60,1,20.07,33,'2024-09-01'),
(61,1,22.54,34,'2024-09-01'),
(62,1,18.58,35,'2024-09-01'),
(63,1,18.58,36,'2024-09-01'),
(64,1,24.03,37,'2024-09-01'),
(65,1,17.1,38,'2024-09-01'),
(66,1,17.1,39,'2024-09-01'),
(67,1,19.57,40,'2024-09-01'),
(68,1,16.6,41,'2024-09-01'),
(69,1,22.05,42,'2024-09-01'),
(70,1,19.08,43,'2024-09-01'),
(71,1,18.58,44,'2024-09-01'),
(72,1,20.56,45,'2024-09-01'),
(73,1,15.12,46,'2024-09-01');

INSERT INTO keys ("game_id","batch_id","key_status_id","key_code") VALUES

(27,27,1,'MIDD-A000-K0106'),
(27,27,1,'MIDD-A001-K0107'),
(27,27,1,'MIDD-A002-K0108'),
(27,27,1,'MIDD-A003-K0109'),
(28,28,1,'HALF-A000-K0110'),
(28,28,1,'HALF-A001-K0111'),
(28,28,1,'HALF-A002-K0112'),
(28,28,1,'HALF-A003-K0113'),
(29,29,1,'THEW-A000-K0114'),
(29,29,1,'THEW-A001-K0115'),
(29,29,1,'THEW-A002-K0116'),
(29,29,1,'THEW-A003-K0117'),
(30,30,1,'LITT-A000-K0118'),
(30,30,1,'LITT-A001-K0119'),
(30,30,1,'LITT-A002-K0120'),
(30,30,1,'LITT-A003-K0121'),
(31,31,1,'BIOS-A000-K0122'),
(31,31,1,'BIOS-A001-K0123'),
(31,31,1,'BIOS-A002-K0124'),
(31,31,1,'BIOS-A003-K0125'),
(32,32,1,'HALF-A000-K0126'),
(32,32,1,'HALF-A001-K0127'),
(32,32,1,'HALF-A002-K0128'),
(32,32,1,'HALF-A003-K0129'),
(33,33,1,'HALF-A000-K0130'),
(33,33,1,'HALF-A001-K0131'),
(33,33,1,'HALF-A002-K0132'),
(33,33,1,'HALF-A003-K0133'),
(34,34,1,'HALF-A000-K0134'),
(34,34,1,'HALF-A001-K0135'),
(34,34,1,'HALF-A002-K0136'),
(34,34,1,'HALF-A003-K0137'),
(35,35,1,'HALF-A000-K0138'),
(35,35,1,'HALF-A001-K0139'),
(35,35,1,'HALF-A002-K0140'),
(35,35,1,'HALF-A003-K0141'),
(36,36,1,'DARK-A000-K0142'),
(36,36,1,'DARK-A001-K0143'),
(36,36,1,'DARK-A002-K0144'),
(36,36,1,'DARK-A003-K0145'),
(37,37,1,'STAR-A000-K0146'),
(37,37,1,'STAR-A001-K0147'),
(37,37,1,'STAR-A002-K0148'),
(37,37,1,'STAR-A003-K0149'),
(38,38,1,'BIOS-A000-K0150'),
(38,38,1,'BIOS-A001-K0151'),
(38,38,1,'BIOS-A002-K0152'),
(38,38,1,'BIOS-A003-K0153'),
(39,39,1,'MIRR-A000-K0154'),
(39,39,1,'MIRR-A001-K0155'),
(39,39,1,'MIRR-A002-K0156'),
(39,39,1,'MIRR-A003-K0157'),
(40,40,1,'HOTL-A000-K0158'),
(40,40,1,'HOTL-A001-K0159'),
(40,40,1,'HOTL-A002-K0160'),
(40,40,1,'HOTL-A003-K0161'),
(41,41,1,'HITM-A000-K0162'),
(41,41,1,'HITM-A001-K0163'),
(41,41,1,'HITM-A002-K0164'),
(41,41,1,'HITM-A003-K0165'),
(42,42,1,'OUTL-A000-K0166'),
(42,42,1,'OUTL-A001-K0167'),
(42,42,1,'OUTL-A002-K0168'),
(42,42,1,'OUTL-A003-K0169'),
(43,43,1,'FARC-A000-K0170'),
(43,43,1,'FARC-A001-K0171'),
(43,43,1,'FARC-A002-K0172'),
(43,43,1,'FARC-A003-K0173'),
(44,44,1,'DEUS-A000-K0174'),
(44,44,1,'DEUS-A001-K0175'),
(44,44,1,'DEUS-A002-K0176'),
(44,44,1,'DEUS-A003-K0177'),
(45,45,1,'PLAY-A000-K0178'),
(45,45,1,'PLAY-A001-K0179'),
(45,45,1,'PLAY-A002-K0180'),
(45,45,1,'PLAY-A003-K0181'),
(46,46,1,'PATH-A000-K0182'),
(46,46,1,'PATH-A001-K0183'),
(46,46,1,'PATH-A002-K0184'),
(46,46,1,'PATH-A003-K0185'),
(47,47,1,'ALAN-A000-K0186'),
(47,47,1,'ALAN-A001-K0187'),
(47,47,1,'ALAN-A002-K0188'),
(47,47,1,'ALAN-A003-K0189'),
(48,48,1,'MARV-A000-K0190'),
(48,48,1,'MARV-A001-K0191'),
(48,48,1,'MARV-A002-K0192'),
(48,48,1,'MARV-A003-K0193'),
(49,49,1,'WOLF-A000-K0194'),
(49,49,1,'WOLF-A001-K0195'),
(49,49,1,'WOLF-A002-K0196'),
(49,49,1,'WOLF-A003-K0197'),
(50,50,1,'DETR-A000-K0198'),
(50,50,1,'DETR-A001-K0199'),
(50,50,1,'DETR-A002-K0200'),
(50,50,1,'DETR-A003-K0201'),
(51,51,1,'GARR-A000-K0202'),
(51,51,1,'GARR-A001-K0203'),
(51,51,1,'GARR-A002-K0204'),
(51,51,1,'GARR-A003-K0205'),
(52,52,1,'AMNE-A000-K0206'),
(52,52,1,'AMNE-A001-K0207'),
(52,52,1,'AMNE-A002-K0208'),
(52,52,1,'AMNE-A003-K0209'),
(53,53,1,'SPEC-A000-K0210'),
(53,53,1,'SPEC-A001-K0211'),
(53,53,1,'SPEC-A002-K0212'),
(53,53,1,'SPEC-A003-K0213'),
(54,54,1,'HALF-A000-K0214'),
(54,54,1,'HALF-A001-K0215'),
(54,54,1,'HALF-A002-K0216'),
(54,54,1,'HALF-A003-K0217'),
(55,55,1,'SAIN-A000-K0218'),
(55,55,1,'SAIN-A001-K0219'),
(55,55,1,'SAIN-A002-K0220'),
(55,55,1,'SAIN-A003-K0221'),
(56,56,1,'PREY-A000-K0222'),
(56,56,1,'PREY-A001-K0223'),
(56,56,1,'PREY-A002-K0224'),
(56,56,1,'PREY-A003-K0225'),
(57,57,1,'FALL-A000-K0226'),
(57,57,1,'FALL-A001-K0227'),
(57,57,1,'FALL-A002-K0228'),
(57,57,1,'FALL-A003-K0229'),
(58,58,1,'BORD-A000-K0230'),
(58,58,1,'BORD-A001-K0231'),
(58,58,1,'BORD-A002-K0232'),
(58,58,1,'BORD-A003-K0233'),
(59,59,1,'THEE-A000-K0234'),
(59,59,1,'THEE-A001-K0235'),
(59,59,1,'THEE-A002-K0236'),
(59,59,1,'THEE-A003-K0237'),
(60,60,1,'DISH-A000-K0238'),
(60,60,1,'DISH-A001-K0239'),
(60,60,1,'DISH-A002-K0240'),
(60,60,1,'DISH-A003-K0241'),
(61,61,1,'DISH-A000-K0242'),
(61,61,1,'DISH-A001-K0243'),
(61,61,1,'DISH-A002-K0244'),
(61,61,1,'DISH-A003-K0245'),
(62,62,1,'DONT-A000-K0246'),
(62,62,1,'DONT-A001-K0247'),
(62,62,1,'DONT-A002-K0248'),
(62,62,1,'DONT-A003-K0249'),
(63,63,1,'HELL-A000-K0250'),
(63,63,1,'HELL-A001-K0251'),
(63,63,1,'HELL-A002-K0252'),
(63,63,1,'HELL-A003-K0253'),
(64,64,1,'GRAN-A000-K0254'),
(64,64,1,'GRAN-A001-K0255'),
(64,64,1,'GRAN-A002-K0256'),
(64,64,1,'GRAN-A003-K0257'),
(65,65,1,'COMP-A000-K0258'),
(65,65,1,'COMP-A001-K0259'),
(65,65,1,'COMP-A002-K0260'),
(65,65,1,'COMP-A003-K0261'),
(66,66,1,'INJU-A000-K0262'),
(66,66,1,'INJU-A001-K0263'),
(66,66,1,'INJU-A002-K0264'),
(66,66,1,'INJU-A003-K0265'),
(67,67,1,'ASSA-A000-K0266'),
(67,67,1,'ASSA-A001-K0267'),
(67,67,1,'ASSA-A002-K0268'),
(67,67,1,'ASSA-A003-K0269'),
(68,68,1,'HITM-A000-K0270'),
(68,68,1,'HITM-A001-K0271'),
(68,68,1,'HITM-A002-K0272'),
(68,68,1,'HITM-A003-K0273'),
(69,69,1,'SIDM-A000-K0274'),
(69,69,1,'SIDM-A001-K0275'),
(69,69,1,'SIDM-A002-K0276'),
(69,69,1,'SIDM-A003-K0277'),
(70,70,1,'CONT-A000-K0278'),
(70,70,1,'CONT-A001-K0279'),
(70,70,1,'CONT-A002-K0280'),
(70,70,1,'CONT-A003-K0281'),
(71,71,1,'LANO-A000-K0282'),
(71,71,1,'LANO-A001-K0283'),
(71,71,1,'LANO-A002-K0284'),
(71,71,1,'LANO-A003-K0285'),
(72,72,1,'SUPE-A000-K0286'),
(72,72,1,'SUPE-A001-K0287'),
(72,72,1,'SUPE-A002-K0288'),
(72,72,1,'SUPE-A003-K0289'),
(73,73,1,'FORH-A000-K0290'),
(73,73,1,'FORH-A001-K0291'),
(73,73,1,'FORH-A002-K0292'),
(73,73,1,'FORH-A003-K0293');
