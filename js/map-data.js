/* Original stylised map geometry for Hyrule (not to scale, not traced).
   Coordinates are in a 1600 x 1100 map space, north up. */
window.HYRULE = (function () {
  'use strict';

  // Regions: smooth blobs built from these control points.
  var regions = [
    { id: 'desert-colossus', name: 'Desert Colossus', aka: ['Evil Desert Colossus'], kind: 'desert',
      pts: [[60,215],[150,185],[250,205],[285,290],[270,420],[185,480],[85,450],[45,330]], label: [165, 214] },
    { id: 'haunted-wasteland', name: 'Haunted Wasteland', aka: ['Mirage Desert'], kind: 'desert',
      pts: [[300,200],[385,175],[445,225],[450,320],[420,390],[345,410],[300,370],[290,280]], label: [370, 222] },
    { id: 'gerudo-fortress', name: "Gerudo's Fortress", aka: ['Gerudo Fortress'], kind: 'desert',
      pts: [[445,350],[520,330],[585,365],[590,445],[535,490],[460,485],[425,425]], label: [508, 362] },
    { id: 'gerudo-valley', name: 'Gerudo Valley', aka: ['Gerudo Desert'], kind: 'canyon',
      pts: [[520,505],[590,480],[645,510],[652,575],[630,650],[565,672],[512,630],[500,560]], label: [576, 512] },
    { id: 'hyrule-field', name: 'Hyrule Field', aka: [], kind: 'field',
      pts: [[670,425],[770,385],[905,380],[1015,420],[1045,520],[1050,650],[960,740],[820,768],[700,730],[655,640],[668,540]], label: [705, 712] },
    { id: 'lon-lon-ranch', name: 'Lon Lon Ranch', aka: [], kind: 'ranch',
      pts: [[795,545],[860,520],[928,545],[938,605],[892,650],[825,650],[788,603]], label: [862, 548] },
    { id: 'hyrule-castle', name: 'Castle Town & Hyrule Castle', aka: ['Hyrule Castle Market', 'Castle Market', "Ganon's Castle"], kind: 'castle',
      pts: [[740,150],[830,105],[945,122],[995,205],[975,315],[900,362],[800,358],[738,300],[722,220]], label: [860, 342] },
    { id: 'kakariko-village', name: 'Kakariko Village', aka: [], kind: 'village',
      pts: [[1045,315],[1130,302],[1222,318],[1240,400],[1222,500],[1130,522],[1072,498],[1048,420]], label: [1140, 330] },
    { id: 'kakariko-graveyard', name: 'Kakariko Graveyard', aka: ['Graveyard'], kind: 'graveyard',
      pts: [[1252,312],[1322,296],[1392,326],[1398,420],[1352,476],[1268,472],[1248,392]], label: [1322, 322] },
    { id: 'death-mountain-trail', name: 'Death Mountain Trail', aka: [], kind: 'mountain',
      pts: [[1058,190],[1140,170],[1222,180],[1258,232],[1234,294],[1140,300],[1065,286],[1040,236]], label: [1105, 186] },
    { id: 'goron-city', name: 'Goron City', aka: [], kind: 'mountain',
      pts: [[962,62],[1040,42],[1120,56],[1136,118],[1102,158],[1022,164],[966,128]], label: [1050, 66] },
    { id: 'death-mountain-crater', name: 'Death Mountain Crater', aka: ['Crater'], kind: 'crater',
      pts: [[1152,48],[1240,26],[1335,44],[1356,110],[1310,164],[1215,158],[1150,122]], label: [1250, 46] },
    { id: 'zoras-river', name: "Zora's River", aka: ['Zora River'], kind: 'river',
      pts: [[1250,505],[1330,488],[1420,508],[1442,572],[1402,650],[1312,672],[1252,632],[1236,562]], label: [1340, 510] },
    { id: 'zoras-domain', name: "Zora's Domain", aka: ['Zora Domain'], kind: 'water',
      pts: [[1410,352],[1482,332],[1552,362],[1562,432],[1522,482],[1442,484],[1404,432]], label: [1484, 372] },
    { id: 'zoras-fountain', name: "Zora's Fountain", aka: ['Zora Fountain'], kind: 'water',
      pts: [[1382,110],[1480,74],[1572,104],[1590,200],[1566,300],[1480,326],[1402,302],[1368,210]], label: [1452, 100] },
    { id: 'kokiri-forest', name: 'Kokiri Forest', aka: [], kind: 'forest',
      pts: [[1170,770],[1270,742],[1372,782],[1404,880],[1364,982],[1252,1012],[1158,972],[1132,870]], label: [1272, 772] },
    { id: 'lost-woods', name: 'Lost Woods', aka: [], kind: 'woods',
      pts: [[990,772],[1068,750],[1128,780],[1130,862],[1090,918],[1010,922],[970,860]], label: [1050, 778] },
    { id: 'sacred-forest-meadow', name: 'Sacred Forest Meadow', aka: ['Sacred Forest Grove', 'Forest Meadow'], kind: 'woods',
      pts: [[838,792],[948,776],[984,850],[976,952],[910,1002],[830,978],[804,880]], label: [896, 800] },
    { id: 'lake-hylia', name: 'Lake Hylia', aka: ['Lakeside Laboratory'], kind: 'lake',
      pts: [[520,822],[640,792],[780,812],[812,902],[782,1002],[660,1062],[540,1032],[490,930]], label: [650, 818] }
  ];

  var dungeons = [
    { id: 'deku-tree', name: 'Inside the Deku Tree', short: 'Deku Tree', region: 'kokiri-forest', icon: 'tree', at: [1268, 880], cols: 4 },
    { id: 'dodongos-cavern', name: "Dodongo's Cavern", short: "Dodongo's Cavern", region: 'death-mountain-trail', icon: 'cave', at: [1200, 238], cols: 5 },
    { id: 'jabu-jabu', name: "Jabu-Jabu's Belly", short: 'Jabu-Jabu', region: 'zoras-fountain', icon: 'fish', at: [1432, 178], cols: 2 },
    { id: 'ice-cavern', name: 'Ice Cavern', short: 'Ice Cavern', region: 'zoras-fountain', icon: 'ice', at: [1528, 178], cols: 2 },
    { id: 'forest-temple', name: 'Forest Temple', short: 'Forest Temple', region: 'sacred-forest-meadow', icon: 'leaf', at: [895, 880], cols: 3 },
    { id: 'fire-temple', name: 'Fire Temple', short: 'Fire Temple', region: 'death-mountain-crater', icon: 'flame', at: [1292, 82], cols: 3 },
    { id: 'water-temple', name: 'Water Temple', short: 'Water Temple', region: 'lake-hylia', icon: 'drop', at: [700, 918], cols: 3 },
    { id: 'shadow-temple', name: 'Shadow Temple', short: 'Shadow Temple', region: 'kakariko-graveyard', icon: 'eye', at: [1322, 398], cols: 3 },
    { id: 'spirit-temple', name: 'Spirit Temple', short: 'Spirit Temple', region: 'desert-colossus', icon: 'sun', at: [165, 336], cols: 3 },
    { id: 'bottom-of-the-well', name: 'Bottom of the Well', short: 'Bottom of the Well', region: 'kakariko-village', icon: 'well', at: [1140, 448], cols: 3 },
    { id: 'ganons-castle', name: "Ganon's Castle", short: "Ganon's Castle", region: 'hyrule-castle', icon: 'tower', at: [930, 200], cols: 1 }
  ];

  // Where the non-dungeon pins of each region cluster.
  var overworld = {
    'kokiri-forest': { at: [1272, 815], cols: 3 },
    'lost-woods': { at: [1050, 835], cols: 3 },
    'sacred-forest-meadow': { at: [895, 832], cols: 1 },
    'hyrule-field': { at: [740, 470], cols: 3 },
    'lon-lon-ranch': { at: [862, 600], cols: 3 },
    'hyrule-castle': { at: [830, 270], cols: 4 },
    'kakariko-village': { at: [1140, 362], cols: 3 },
    'kakariko-graveyard': { at: [1322, 345], cols: 2 },
    'death-mountain-trail': { at: [1066, 252], cols: 2 },
    'goron-city': { at: [1050, 112], cols: 2 },
    'death-mountain-crater': { at: [1196, 92], cols: 2 },
    'zoras-river': { at: [1338, 570], cols: 2 },
    'zoras-domain': { at: [1484, 420], cols: 1 },
    'zoras-fountain': { at: [1480, 128], cols: 3 },
    'lake-hylia': { at: [585, 870], cols: 2 },
    'gerudo-valley': { at: [576, 568], cols: 2 },
    'gerudo-fortress': { at: [508, 420], cols: 2 },
    'haunted-wasteland': { at: [370, 300], cols: 1 },
    'desert-colossus': { at: [165, 262], cols: 3 }
  };

  // Base terrain, drawn under the regions.
  var terrain = [
    // frame
    '<rect x="6" y="6" width="1588" height="1088" rx="18" class="t-frame"/>',
    '<rect x="16" y="16" width="1568" height="1068" rx="12" class="t-frame2"/>',
    // desert wash (west)
    '<path class="t-sand" d="M30 170 C140 140 330 140 470 190 C560 225 620 300 640 390 C660 470 640 560 610 690 C560 720 470 700 420 620 C380 560 330 520 250 520 C150 520 70 500 30 460 Z"/>',
    '<g class="t-dunes"><path d="M80 500 q30 -14 60 0 q30 14 60 0"/><path d="M300 450 q30 -14 60 0 q30 14 60 0"/><path d="M110 150 q30 -14 60 0 q30 14 60 0"/><path d="M380 140 q25 -12 50 0 q25 12 50 0"/><path d="M220 480 q25 -12 50 0"/></g>',
    // great field meadow
    '<path class="t-grass" d="M650 380 C760 330 960 330 1060 400 C1110 470 1110 600 1070 690 C1010 780 860 810 730 780 C640 750 610 640 625 540 C630 470 630 410 650 380 Z"/>',
    // Death Mountain massif
    '<path class="t-rock" d="M930 175 C960 110 1000 40 1060 20 L1180 8 C1250 4 1320 12 1370 40 C1380 100 1360 170 1300 200 C1290 260 1270 310 1240 320 L1040 310 C1000 270 950 230 930 175 Z"/>',
    '<g class="t-peaks"><path d="M960 180 l40 -70 l40 70"/><path d="M1350 190 l26 -50 l26 50"/><path d="M1000 300 l30 -48 l30 48"/><path d="M1340 270 l22 -40 l22 40"/></g>',
    '<path class="t-smoke" d="M1240 26 c-10 -12 6 -18 0 -26 M1262 24 c10 -12 -4 -18 4 -24"/>',
    // forest canopy (south-east)
    '<path class="t-forest" d="M800 770 C900 740 1050 720 1150 740 C1300 720 1440 760 1450 880 C1460 1000 1340 1060 1220 1050 C1080 1060 940 1050 820 1010 C770 960 760 840 800 770 Z"/>',
    // waters: Zora's Fountain -> Domain -> River -> Field -> Lake Hylia
    '<path class="t-river" d="M1478 300 C1470 340 1480 380 1470 430 C1460 480 1400 500 1360 540 C1320 580 1300 620 1240 640 C1160 665 1090 660 1040 690 C980 730 900 760 820 780 C760 800 720 812 690 840"/>',
    // Gerudo river down the valley into the lake
    '<path class="t-river thin" d="M600 470 C590 520 600 580 585 640 C570 700 560 760 590 830"/>',
    '<path class="t-lake" d="M530 850 C600 805 720 810 790 860 C830 920 790 1010 690 1046 C600 1070 520 1030 500 960 C490 910 500 870 530 850 Z"/>',
    '<path class="t-lake" d="M1420 140 C1460 120 1530 125 1555 165 C1570 220 1545 270 1490 285 C1440 290 1400 260 1395 215 C1392 180 1400 155 1420 140 Z"/>',
    // roads (dashed) radiating from the field
    '<g class="t-road">' +
      '<path d="M860 380 L860 360"/>' +                     // castle
      '<path d="M1045 450 C1060 440 1060 420 1070 410"/>' +  // kakariko
      '<path d="M1048 600 C1120 590 1200 580 1240 570"/>' +  // zora river
      '<path d="M1010 720 C1040 740 1060 760 1070 760"/>' +  // to forest
      '<path d="M1128 820 C1140 820 1150 820 1150 820"/>' +
      '<path d="M760 760 C730 790 700 800 690 820"/>' +      // lake
      '<path d="M660 600 C650 590 640 580 640 575"/>' +      // valley
      '<path d="M540 500 L530 485"/>' +                     // fortress
      '<path d="M440 330 L450 330"/>' +
      '<path d="M290 300 L280 300"/>' +
      '<path d="M1140 300 L1140 290"/>' +                    // trail
      '<path d="M1236 400 L1252 398"/>' +                    // graveyard
      '<path d="M1420 520 C1430 500 1440 490 1445 482"/>' +  // domain
      '<path d="M1480 352 L1480 326"/>' +                    // fountain
      '<path d="M1060 186 C1070 170 1080 166 1090 160"/>' +  // goron city
      '<path d="M1215 182 C1210 170 1212 166 1214 158"/>' +  // crater
    '</g>',
    // compass rose
    '<g class="t-compass" transform="translate(300 930)">' +
      '<circle r="62" class="c-ring"/><circle r="50" class="c-ring2"/>' +
      '<path d="M0 -74 L11 -11 L0 0 Z" class="c-dark"/><path d="M0 -74 L-11 -11 L0 0 Z" class="c-light"/>' +
      '<path d="M0 74 L-11 11 L0 0 Z" class="c-dark"/><path d="M0 74 L11 11 L0 0 Z" class="c-light"/>' +
      '<path d="M74 0 L11 11 L0 0 Z" class="c-dark"/><path d="M74 0 L11 -11 L0 0 Z" class="c-light"/>' +
      '<path d="M-74 0 L-11 -11 L0 0 Z" class="c-dark"/><path d="M-74 0 L-11 11 L0 0 Z" class="c-light"/>' +
      '<text y="-82" class="c-n">N</text>' +
    '</g>',
    // cartouche
    '<g class="t-cartouche" transform="translate(70 1000)">' +
      '<text class="cart-title" x="0" y="0">HYRULE</text>' +
      '<text class="cart-sub" x="2" y="30">100 Gold Skulltulas · not to scale</text>' +
    '</g>'
  ];

  // Decorative trees scattered over the forest (deterministic).
  (function () {
    var spots = [[1160,760],[1400,800],[1420,940],[1140,1000],[1320,1030],[1000,960],[950,1010],[820,1000],[790,920],[1000,740],[1110,1030],[1440,870],[1215,1030],[1060,960],[830,770]];
    var g = '<g class="t-trees">';
    spots.forEach(function (p) {
      g += '<g transform="translate(' + p[0] + ' ' + p[1] + ')"><rect x="-2" y="2" width="4" height="9"/><circle r="10" cy="-3"/></g>';
    });
    terrain.push(g + '</g>');
  })();

  // Landmarks (small original pictograms).
  var landmarks = [
    // Hyrule Castle silhouette
    '<g class="lm castle" transform="translate(840 190)"><path d="M-44 30 V-6 h10 v-10 h8 v10 h10 V-30 h8 v-8 h8 v8 h8 V-6 h10 v-10 h8 v10 h10 V30 Z"/><path class="lm-door" d="M-6 30 v-14 a6 6 0 0 1 12 0 v14 Z"/></g>',
    // Lon Lon Ranch fence ring
    '<ellipse class="lm fence" cx="862" cy="598" rx="58" ry="34"/>',
    // Lake island tree trunk
    '<g class="lm" transform="translate(700 980)"><path class="lm-trunk" d="M-3 10 V-10 l-6 -6 M3 10 V-12 l5 -6"/></g>',
    // Kakariko windmill
    '<g class="lm mill" transform="translate(1200 470)"><rect x="-5" y="-4" width="10" height="16"/><path d="M0 -4 L-14 -18 M0 -4 L14 -18 M0 -4 L-14 10 M0 -4 L14 10"/></g>',
    // Graveyard stones
    '<g class="lm stones" transform="translate(1272 440)"><path d="M0 0 v-10 a5 5 0 0 1 10 0 v10 Z"/><path d="M16 4 v-10 a5 5 0 0 1 10 0 v10 Z"/></g>'
  ];

  return { width: 1600, height: 1100, regions: regions, dungeons: dungeons, overworld: overworld, terrain: terrain, landmarks: landmarks };
})();
