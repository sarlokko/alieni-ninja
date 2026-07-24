(() => {
  "use strict";

  const PX = 2;

  function parseSprite(rows, palette) {
    const h = rows.length;
    const w = rows[0].length;
    const pixels = new Array(h * w);
    rows.forEach((row, y) => {
      const chars = [...row];
      for (let x = 0; x < w; x++) {
        const ch = chars[x] || ".";
        pixels[y * w + x] = Object.prototype.hasOwnProperty.call(palette, ch) ? palette[ch] : null;
      }
    });
    return bakeSprite({ w, h, pixels });
  }

  function bakeSprite(sprite) {
    const { w, h, pixels } = sprite;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext("2d");
    c.imageSmoothingEnabled = false;
    for (let i = 0; i < pixels.length; i++) {
      const color = pixels[i];
      if (!color) continue;
      c.fillStyle = color;
      c.fillRect(i % w, Math.floor(i / w), 1, 1);
    }
    sprite.canvas = canvas;
    return sprite;
  }

  const SPRITES = {
    // kael
    kael: parseSprite([
      "................A...............",
      "...............AAA..............",
      "..............AAAAA.............",
      "..............BAAAB.............",
      "............BBBCABBBB...........",
      "..........BBBBDCCDBBBBB.........",
      ".........BBBDEBBBBBBBDBD........",
      "........BBBDEBDBBDBBDBBBB.......",
      "........DBBBBBBBBBBBBBBBB.......",
      "........BBBDBDBBDDDBBBBDB.......",
      ".......BBBBDDBDBBDBBBBBBBB......",
      ".......BDDFFFFFFFFFFFFBBBB......",
      ".......BBDFGHGGFFGHGGFBBBB......",
      "......FFBBFGGGGFFGGGGFBBBFF.....",
      ".....FFFDDFFFFFFFFFFFFDBBFFF....",
      "....FFFFBBBBBBBBBBBBBBBBBFFFF...",
      "...FFFFFDDDBBBBBDBDBDDDBFFFFFF..",
      "...FFFFFDFBDDBBBBBBBBDBFFFFFFF..",
      "...FFFFFFFFFBBBBBBBBBFFFFFFFFF..",
      "..FFFFFFFFFFFHBBBBBFFFFFFFFFFFF.",
      "..FFFFFFFFFFFHHHHFHFFFFFFFFFFFF.",
      "..FFFFFFFFFFFFHHHHHHFFFFFFFFFFF.",
      "...FFFFFFFFFFHHHHHFHFFFFFFFFFF..",
      "...FFFFFFFFFFHHHHFFHFFFFFFFFFF..",
      "...FFFFFFFFFCCCAACCCCFFFFFFFFF..",
      "....FFFFFFFCCCCCCCCCCCFFFFFFF...",
      ".....FFFFFHHFHHHHHHHHHHFFFFF....",
      "......FFFHHHHHHFFHFFHHF.FFF.....",
      "..........FHHHHHHHHHHH..........",
      "..........FFHHHHHHHHHF..........",
      "..........FFFFFHHHFFFF..........",
      "..........FFFFF..FFFFF..........",
      "..........FFFFF..FFFFF..........",
      "..........CCCCC..CCCCC..........",
      "..........CCCCC..CCCCC..........",
      "................................"
    ], { '.':null,'A':'#88ccff','B':'#3aa0ff','C':'#1e90ff','D':'#1e6acc','E':'#8ad0ff','F':'#050818','G':'#e8f0ff','H':'#0a1030' }),

    // zara
    zara: parseSprite([
      "................................",
      "..........AAAAAAAAAA............",
      "..........AAAAAAAAAA............",
      "..........AAAAAAAAAA............",
      "..........AAAAAAAAAAB...........",
      "..........AAAAAAAAAABBB.........",
      ".........BBBCDAABBBBBCBC........",
      "........BBBCDBAABCBBCBBBB.......",
      "........CBBBBBBBBBBBBBBBB.......",
      "........BBBCBCBBCCCBBBBCB.......",
      ".......BBBBCCBCBBCBBBBBBBB......",
      ".......BCCBEEEEBBEEEEBBBBB......",
      ".......BBCBEFEECBEFEEBBBBB......",
      "........BBBEEEEBCEEEEBBBB.......",
      ".EEEE...CCCBBCCBBBBBCBCBB..EEEE.",
      ".EGGE...BBBBBBBBBBBBBBBBB..EGGE.",
      ".EGGE....CCBBBBBCBCBCCCB...EGGE.",
      ".EGGEHHHC.BCCBBBBBBBBCBHHHHEGGE.",
      ".EGGEHHHHHHHBBBBBBBBBHAHHHHEGGE.",
      ".EGGEHHHHHAAHHBBBBBAHAHHHHHEGGE.",
      ".EGGE....AAHHHHHHAHAHHHH...EGGE.",
      ".EGGE...HHHHHAHHHHHHHHHHH..EGGE.",
      ".EGGE...HHHAAHHHHHAHAAHHH..EGGE.",
      ".EEEE...HHHHAHHHHAAHAHHHH..EEEE.",
      ".........HEEEEEGGEEEEEAH........",
      ".........HEEEEEEEEEEEEHH........",
      ".........HHHAHHHHHHHHHHH........",
      ".........HHHHHHAAHAAHHA.........",
      "..........AHHHHHHHHHHH..........",
      "..........AAHHHHHHHHHA..........",
      "..........AAAAAHHHAAAA..........",
      "..........AAAAA..AAAAA..........",
      "..........AAAAA..AAAAA..........",
      "..........EEEEE..EEEEE..........",
      "..........EEEEE..EEEEE..........",
      "................................"
    ], { '.':null,'A':'#3a0870','B':'#b44cff','C':'#7a20cc','D':'#d080ff','E':'#39ff14','F':'#103010','G':'#a0ff66','H':'#6a10cc' }),

    // vex
    vex: parseSprite([
      "................................",
      "................................",
      "................................",
      "..............AAAAA.............",
      "............AAAAAAAAA...........",
      "..........AAAABAABAAAAA.........",
      ".........AAABCAAAAAAABAB........",
      "........AAABCABAABAABAAAA.......",
      "........BBBBBBBBBBBBBBBAA.......",
      "........ABBBBBBBBBBBBBBBA.......",
      ".......AABBBBBBBBBBBBBBAAA......",
      ".......ABBDEFEEDDEFEEDBAAA......",
      ".......AABDEEEEDDEEEEDBAAA......",
      ".......GABDDDDDDDDDDDDBAAG......",
      "....GGGGBBBBBBBBBBBBBBBAAGGGG...",
      "....GGGGABBBGGGGGGGGBBBAAGGGG...",
      "...GGGGGBBBAGGGGGGGGBBBAGGGGGG..",
      "....GGGGBGABBAAAAAAAABAGGGGGG...",
      "....GGGGGGGBAAAAAAAAABGGGGGGG...",
      ".....BBGBBDDBBAAAAADBDBBBGB.....",
      ".....BBBBBDBBBBBBDBDBBBBBBB.....",
      ".....BBBBBBBBDBBBBBBBBBBBBB.....",
      ".....BBBBBBDDBBBBBDBDDBBBBB.....",
      ".....BBBBBBBDBBBBDDBDBBBBBB.....",
      ".....BBBBBEEEEEHHEEEEEBBBBB.....",
      ".........BEEEEEEEEEEEEBB........",
      ".........BBBDBBBBBBBBBBB........",
      ".........BBBBBBDDBDDBBD.........",
      "..........DBBBBBBBBBBB..........",
      "..........DDBBBBBBBBBD..........",
      "..........DDDDDBBBDDDD..........",
      "..........DDDDD..DDDDD..........",
      "..........DDDDD..DDDDD..........",
      "..........EEEEE..EEEEE..........",
      "..........EEEEE..EEEEE..........",
      "................................"
    ], { '.':null,'A':'#8a98a8','B':'#5a6678','C':'#c0cad4','D':'#3a4450','E':'#ffd700','F':'#402000','G':'#a8b4c0','H':'#ffe888' }),

    // nia
    nia: parseSprite([
      "................................",
      "................................",
      "................................",
      "..............AAAAA.............",
      "............AAAAAAAAA...........",
      "..........AAAABAABAAAAA.........",
      ".........AAABCAAAAAAABAB........",
      "........AAABCABAABAABAAAA.......",
      "........BAAAAAAAAAAAAAAAD.......",
      "........AAABABAABBBAAAABD.......",
      ".......AAAABBABAABAAAAAADE......",
      ".......ABBAFGFFAAFGFFAAADA......",
      ".......AABAFFFFBAFFFFAAADD......",
      "........AAABAAAABAAABAAADF......",
      "........BBFAABBAAAAABFBAAEE.....",
      "........AAAAAAAAAAAAAAAAAEE.....",
      ".........BBAAAAABABABBBAEEE.....",
      ".....DDDB.ABBAAAAAAAABADEEE.....",
      ".....DDDDDDDAAAAAAAAADEDEEE.....",
      ".....DDDDDEEDDAAAAAEDEDDEEE.....",
      ".....DDDDEEDDDDDDEDEDDDDEEE.....",
      ".....DDDDDDDDEDDDDDDDDDDEEE.....",
      ".....DDDDDDEEDDDDDEDEEDDEEE.....",
      ".....DDDDDDDEDDDDEEDEDDDEEE.....",
      ".....DDDDDFFFFFHHFFFFFEDDDD.....",
      ".........DFFFFFFFFFFFFDD........",
      ".........DDDEDDDDDDDDDDD........",
      ".........DDDDDDEEDEEDDE.........",
      "..........EDDDDDDDDDDD..........",
      "..........EEDDDDDDDDDE..........",
      "..........EEEEEDDDEEEE..........",
      "..........EEEEE..EEEEE..........",
      "..........EEEEE..EEEEE..........",
      "..........FFFFF..FFFFF..........",
      "..........FFFFF..FFFFF..........",
      "................................"
    ], { '.':null,'A':'#d0d0e0','B':'#9090a8','C':'#f0f0f8','D':'#a0a0c0','E':'#707090','F':'#ff69b4','G':'#401030','H':'#ffb0d0' }),

    // ryn
    ryn: parseSprite([
      "................................",
      "..............AAAAA.............",
      "...........AAAAAAAAAAA..........",
      "..........AAAAAAAAAAAAA.........",
      "........AAAAAAABBBAAAAAAA...C...",
      "........AAAABBBBBBBBBAAAA.CCCCC.",
      ".......AAAABBBBBBBBBBBAAAACCCCC.",
      ".......AAABBBBBBBBBBBBBAAACCDCCC",
      "......AAABBBBBBBBBBBBBBBAAACCCC.",
      "......AAABBBBBBBBBBBBBBBAAACCCC.",
      "......AABBBBBBBBBBBBBBBBBAAEC...",
      ".......ABBBCFCCBBCFCCBBBBA.EE...",
      ".......ABBBCCCCBBCCCCBBBBA.EE...",
      "........ABBBBBBBBBBBBBBBA..EE...",
      "........ABBBBBBBBBBBBBBBA..EE...",
      "........BBBBBBBBBBBBBBBBB..EE...",
      ".........GGBBBBBBBBBBBGB...EE...",
      "......HHGHBGBBBBBBBBBGBHHH.EE...",
      "......HHHHHHBBBBBBBBBHHHHH.EE...",
      "......HHHHAAHHBBBBBAHAHHHH.EE...",
      "......HHHHAHHHHHHAHAHHHHHH.EE...",
      "......HHHHHHHAHHHHHHHHHHHH.EE...",
      "......HHHHHAAHHHHHAHAAHHHH.EE...",
      "......HHHHHHAHHHHAAHAHHHHH.EE...",
      "......HHHHCCCCCEECCCCCHHHH.EE...",
      ".........HCCCCCCCCCCCCHH...EE...",
      ".........HHHAHHHHHHHHHHH...EE...",
      ".........HHHHHHAAHAAHHA....EE...",
      "..........AHHHHHHHHHHH.....EE...",
      "..........AAHHHHHHHHHA.....EE...",
      "..........AAAAAHHHAAAA..........",
      "..........AAAAA..AAAAA..........",
      "..........AAAAA..AAAAA..........",
      "..........CCCCC..CCCCC..........",
      "..........CCCCC..CCCCC..........",
      "................................"
    ], { '.':null,'A':'#044858','B':'#40e8ff','C':'#ffd700','D':'#ffffff','E':'#bb8800','F':'#403000','G':'#1090a8','H':'#087888' }),

    // cat_kitten
    cat_kitten: parseSprite([
      "............................",
      ".......AA...BBB...AA........",
      ".......AABBBBBBBBBAA........",
      ".......ACBBBBBBBBCAA........",
      ".......BCBBBBBBBBCAB........",
      "......BBCBBBBBBBBCABB.......",
      "......BBABBBBBBBBBABB.......",
      ".....BBBBDEEBBBDEEBBBB......",
      ".....BBBBEFEBBBEFEBBBB......",
      ".....BBBBEEEBBBEEEBBBB......",
      "......BBGBBBCHCBBBBGB.......",
      ".....BBBBBBBCCCBBBBBBB......",
      "....BJJBBBBBBBBBBBBBBBB.BJ..",
      "....BJBJBBBBBBBBBBBBJBB.BJ..",
      "...BJBBBBBBBBBBBBBBBBBBBBJ..",
      "...BBBBBBCCCBBBCCCBBBBBBBJ..",
      "...BBBJBBCCCCCCCCCBJBBBB.BJ.",
      "....BBBBCCCCCCCCCCCBJJB..BJ.",
      "....BBBBBCCCCCCCCCBBBBB..BJ.",
      ".....BBJBCCCCCCCCCBJBB...BJ.",
      "......JJJJCJJJJCJJJJB.......",
      "......JJJJJJJJJBJJJJ........",
      "......JJJJ.JJJJBJJJJ........",
      "......JJJJ.JJJJ.JJJJ........",
      "......KKKK.KKKK.KKKK........",
      "............................"
    ], { '.':null,'A':'#cc8844','B':'#ddaa66','C':'#ffe0b0','D':'#ffffff','E':'#ffee22','F':'#402800','G':'#ffb0b0','H':'#ff6688','J':'#bb8844','K':'#ffddaa' }),

    // cat_tabby
    cat_tabby: parseSprite([
      "............................",
      ".......AA...BBB...AA........",
      ".......AABBBBBBBBBAA........",
      ".......ACBBBBBBBBCAA........",
      ".......BCBBBBBBBBCAB........",
      "......BBDDBDDBDDBDDBB.......",
      "......BBDDBDDBDDBDDBB.......",
      ".....BBBBEFFBBBEFFBBBB......",
      ".....BBBBFGFBBBFGFBBBB......",
      ".....BBBBFFFBBBFFFBBBB......",
      "......BBBBBBCHCBBBBBB.......",
      ".....BBBBBBBCCCBBBBBBB......",
      "....BDDBBBBBBBBBBBBBBBB.BD..",
      "....BDBDBBBBBBBBBBBBDBB.BD..",
      "...BDBBDDBDDBDDBDDBBBBBBBD..",
      "...BBBBDDCDDBDDCDDBBBBBBBD..",
      "...BBBDDDCDDCDDCDDBDBBBB.BD.",
      "....BBBBCCCCCCCCCCCBDDB..BD.",
      "....BBBBBCCCCCCCCCBBBBB..BD.",
      ".....BBDBCCCCCCCCCBDBB...BD.",
      "......DDDDCDDDDCDDDDB.......",
      "......DDDDDDDDDBDDDD........",
      "......DDDD.DDDDBDDDD........",
      "......DDDD.DDDD.DDDD........",
      "......JJJJ.JJJJ.JJJJ........",
      "............................"
    ], { '.':null,'A':'#aa6622','B':'#cc8844','C':'#e8c080','D':'#884422','E':'#ffffff','F':'#aaff44','G':'#203010','H':'#aa5533','J':'#ffcc88' }),

    // cat_hunter
    cat_hunter: parseSprite([
      "............................",
      ".......AA...BBB...AA........",
      ".......AABBBBBBBBBAA........",
      ".......ACBBBBBBBBCAA........",
      ".......BCBBBBBBBBCAB........",
      "......BBCBBBBBBBBCABB.......",
      "......BBABBBBBBBBBABB.......",
      ".....BBBBDEEBBBDEEBBBB......",
      ".....BBBBEFEBBBEFEBBBB......",
      ".....BBBBEEEBBBEEEBBBB......",
      "......BBBBBBCGCBBBBBB.......",
      ".....BBBBBBBCCCBBBBBBB......",
      "....BHHBBBBDBBBDBBBBBBB.BH..",
      "....BHBHBBBDBBBDBBBBHBB.BH..",
      "...BHBBBBBBBBBBBBBBBBBBBBH..",
      "...BBBBBBCCCBBBCCCBBBBBBBH..",
      "...BBBHBBCCCCCCCCCBHBBBB.BH.",
      "....BBBBCCCCCCCCCCCBHHB..BH.",
      "....BBBBBCCCCCCCCCBBBBB..BH.",
      ".....BBHBCCCCCCCCCBHBB...BH.",
      "......HHHHCHHHHCHHHHB.......",
      "......HHHHHHHHHBHHHH........",
      "......HHHH.HHHHBHHHH........",
      "......HHHH.HHHH.HHHH........",
      ".....DDJJJ.JJJJ.JJJJDD......",
      "............................"
    ], { '.':null,'A':'#994422','B':'#bb7733','C':'#d8a060','D':'#ffffff','E':'#ff2222','F':'#400000','G':'#882200','H':'#7a4418','J':'#ffaa66' }),

    // cat_archer
    cat_archer: parseSprite([
      "............................",
      ".......AA...BBB...AA........",
      ".......AABBBBBBBBBAA........",
      ".......ACBBBBBBBBCAA........",
      ".......BCBBBBBBBBCAB........",
      "......BBCBBBBBBBBCABB.......",
      "......BBABBBBBBBBBABB.......",
      ".....BBBBDEEBBBDEEBBBB......",
      ".....BBBBEFEBBBEFEBBBBG.....",
      ".....BBBBEEEBBBEEEBBBBGG....",
      "......BBBBBBCHCBBBBBB.GG....",
      ".....BBBBBBBCCCBBBBBBBG.G...",
      "...JJKKBBBBBBBBBBBBBBBG.GK..",
      "...JJKBKBBBBBBBBBBBBKBG.BG..",
      "...JJBBBBBBBBBBBBBBBBBGBGK..",
      "...JJBBBBCCCBBBCCCBBBBGBGK..",
      "...JJBKBBCCCCCCCCCBKBBGG.BK.",
      "...JJBBBCCCCCCCCCCCBKKGG.BK.",
      "....BBBBBCCCCCCCCCBBBBG..BK.",
      ".....BBKBCCCCCCCCCBKBB...BK.",
      "......KKKKCKKKKCKKKKB.......",
      "......KKKKKKKKKBKKKK........",
      "......KKKK.KKKKBKKKK........",
      "......KKKK.KKKK.KKKK........",
      "......LLLL.LLLL.LLLL........",
      "............................"
    ], { '.':null,'A':'#a07840','B':'#c8a060','C':'#e8d090','D':'#ffffff','E':'#66cc44','F':'#203010','G':'#8b5a2b','H':'#884422','J':'#6b4423','K':'#8a6830','L':'#d0a870' }),

    // cat_werewolf
    cat_werewolf: parseSprite([
      "............................",
      ".......AA...BBB...AA........",
      ".......AABBBBBBBBBAA........",
      ".......ACBBBBBBBBCAA........",
      ".......BCBBBBBBBBCAB........",
      "......BBCBBBBBBBBCABB.......",
      "......BBABBBBBBBBBABB.......",
      ".....BBBBDEEBBBDEEBBBB......",
      ".....BBBBEFEBBBEFEBBBB......",
      ".....BBBBEEEBBBEEEBBBB......",
      "......BBBBBBCGCBBBBBB.......",
      ".....BBBBBBBCCCBBBBBBB......",
      "....BHHBBBBDBBBDBBBBBBB.BH..",
      "....BHBHBBBDBBBDBBBBHBB.BH..",
      "...BHBBBBBBBBBBBBBBBBBBBBH..",
      "...BBBBBBCCCBBBCCCBBBBBBBH..",
      "...BBBHBBCCCCCCCCCBHBBBB.BH.",
      "....BBBBCCCCCCCCCCCBHHB..BH.",
      "....BBBBBCCCCCCCCCBBBBB..BH.",
      ".....BBHBCCCCCCCCCBHBB...BH.",
      "......HHHHCHHHHCHHHHB.......",
      "......HHHHHHHHHBHHHH........",
      "......HHHH.HHHHBHHHH........",
      "......HHHH.HHHH.HHHH........",
      "......JJJJ.JJJJ.JJJJ........",
      "............................"
    ], { '.':null,'A':'#772211','B':'#994422','C':'#bb6644','D':'#ffffff','E':'#ff2222','F':'#300000','G':'#440000','H':'#662211','J':'#ff4422' }),

    // cat_shadow
    cat_shadow: parseSprite([
      "............................",
      ".......AA...BBB...AA........",
      ".......AABBBBBBBBBAA........",
      ".......ACBBBDBBBBCAA........",
      ".......BCBBBBBBBBCAB........",
      "......BBCBDBBBBBDCABB.......",
      "......BBABBBBBBBBBABB.......",
      ".....BBBBEFFBBBEFDBBBB......",
      ".....BBBBFGFBBDFGFBBBB......",
      ".....DBBBFFFBBBFFFBBBB......",
      "......BBBBBBCHCBBBBBB.......",
      ".....BBBDBBBCCCBBBBBBB......",
      "....BDDBBBBBBBBBBBBBDDB.D...",
      "....BDDDBBBBDBBBBBBBDBB.D...",
      "...BDBBBBBBBBBBBBBBDBBBBD...",
      "...BBBBBBCCCBDBCCCBBBBBBD...",
      "...BBBDBBCDCCCCCCCBDBBBBD...",
      "....BBBBCCCCCCCCCCCBDDB.D...",
      "....BBBBBCCCCCCCCCBBDBD.D...",
      ".....BBDBCCCCCCCCCBDBB..D...",
      "......DDDDCDDDDCDDDDB.......",
      "......DDDDDDDDDBDDDD........",
      "......DDDD.DDDDDDDDD........",
      "......DDDD.DDDD.DDDD........",
      "......DGGG.GGGG.GGGG........",
      "............................"
    ], { '.':null,'A':'#331144','B':'#442266','C':'#664488','D':'#2a1040','E':'#ffffff','F':'#cc88ff','G':'#ff44ff','H':'#aa66cc' }),

    // cat_boss
    cat_boss: parseSprite([
      "...........ABCCCCCDCCCCBAA..........",
      "........A..ACCECCCCCCECCAA..A.......",
      "......AAAAAACCCCCCCCCCCCAAAAAAA.....",
      "......AAAAAACCCCCCCCCCCCAAAAAAA.....",
      ".....AAAAAAAFFFFFFFFFFFFFAAAAAAA....",
      ".....AAAAAAFFFFFFFFFFFFFFAAAAAAA....",
      "...AAAAAAAAFFFFFFFFFFFFFFAAAAAAAAA..",
      "...AAAAAAAAFFFFFFFFFFFFFFAAAAAAAAA..",
      "..AAAAAAAAAFFFFFFFFFFFFFFAAAAAAAAAA.",
      "...AAAAAAAAFDGGGFFFFDGGGFAAAFAAAAA..",
      "..AAAAAAFFFFGEGGFFFFGEGGFFFFFAAAAAA.",
      "..AAAAA.FFFFGGGGFFFFGGGGFFFFF.AAAAA.",
      ".AAAAAAAFFFFGGGGFFFFGGGGFFFFFAAAAAAA",
      "..AAAAAFFFFFFFFFFFFFFFFFFFFFFAAAAAA.",
      "..AAAAFFAFFFFFFFFHHFFFFFFFFFFFFAAAA.",
      "...AAAFFFFFFFFDDFFFFDDFFFFFFFFFAAA..",
      "..AAAFAAFAFFFFDDFFFFDDFFFFFFAFAFAAA.",
      "...AAAFFAFAFFFDDFFFFDDFFFFFFFFFFAA..",
      "...AAFFFFFAFFFDDFFFFDDFFFFFAAFFFAA..",
      ".....AAFFFAJJFFFFFFFFFFFJJFFFFFF....",
      ".....AFFFFFJJJJJFFFFFJJJJJFFFAFF....",
      "......FFFAAJJJJJJJJJJJJJJJAFFFF.....",
      "......FFFAFFJJJJJJJJJJJJJFFFFFF.....",
      ".......FAFAFFJJJJJJJJJJJFFAFFF......",
      "........FAFFFFJJJJJJJJJFAFFFF.......",
      ".........FFFFAAFAJJJAAAFAAFF........",
      "........AAAAAFFAAAAAAAAFAAAAA.......",
      "........AAAAAAAAAAAAAFFFAAAAA.......",
      "........AAAAA...AAAAA...AAAAA.......",
      "........AAAAA...AAAAA...AAAAA.......",
      "........AAAAA...AAAAA...AAAAA.......",
      "........AAAAA...AAAAA...AAAAA.......",
      ".......DDCCCC...CCCCC...CCCCCDD.....",
      "...................................."
    ], { '.':null,'A':'#661100','B':'#ffaa00','C':'#ffd700','D':'#ffffff','E':'#ff2222','F':'#aa3311','G':'#ff6644','H':'#880000','J':'#cc5522' }),

    // tile_training
    tile_training: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABAAAAAAAAAAAABB",
      "BBAAAAAAAAAAAABB",
      "ABAABBBBBBBBAABB",
      "BBAABBBBBBBBAABB",
      "ABAABBBBBBBBAABB",
      "BBAABBBCBBBBAABB",
      "ABAABBBBCBBBAABB",
      "BBAABBBBBBBBAABB",
      "ABAABBBBBBBBAABB",
      "BBAABBBBBBBBAABB",
      "ABAAAAAAAAAAAABB",
      "BBAAAAAAAAAAAABB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#0d1b2a','B':'#152238','C':'#00f5ff' }),

    // tile_alien_city
    tile_alien_city: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABAAAAABBBBBBBBB",
      "BBACAAABBBBBBBBB",
      "ABAAAAABBBBBBBBB",
      "BBAAAAABBBBBBBBB",
      "ABAAAAABBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "CCCCCCCCCCCCCCCC",
      "BBBBBBBBBAAAAABB",
      "ABBBBBBBBACAAABB",
      "BBBBBBBBBAAAAABB",
      "ABBBBBBBBAAAAABB",
      "BBBBBBBBBAAAAABB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#1a0a2e','B':'#1e1040','C':'#b026ff' }),

    // tile_forest
    tile_forest: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBCBBBBBBBBBBBBB",
      "ABBCAABBBBBBBBBB",
      "BBBBAABBBBBBBBBB",
      "ABBBBBBBBBBCBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBCBBBBBBBBBB",
      "BBBBBBCBBBAABBBB",
      "ABBBBBBBBBAABBBB",
      "BBBBBBBBBBBBBBCB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBCBBBBBBB",
      "ABBBBBBBBCBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#0a1f0a','B':'#0f2a12','C':'#39ff14' }),

    // tile_temple
    tile_temple: parseSprite([
      "ABABABABABABABAB",
      "BAAAAAAAAAAAAAAB",
      "AAAAAAAAAAAAAAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAABBBBCCBBBBAAB",
      "AAABBBBCBBBBBAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAAAAAAAAAAAAAAB",
      "AAAAAAAAAAAAAAAB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#2a1a0a','B':'#3a2818','C':'#ffd700' }),

    // tile_underworld
    tile_underworld: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBAAAAAABBBBB",
      "ABBBBAAAAAABBBBB",
      "BBBBBAAAAAABBBBB",
      "ABBBBAAAAAABBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABCBCBCBCBCBCBBB",
      "BBBDBDBDBDBDBDBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#1a0a0a','B':'#2a1010','C':'#ff4466','D':'#ff6622' }),

    // tile_star_temple
    tile_star_temple: parseSprite([
      "ABABABABABABABAB",
      "BAAAAAAAAAAAAAAB",
      "AAAAAAAAAAAAAAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAABBBBCCBBBBAAB",
      "AAABBBBCBBBBBAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAABBBBBBBBBBAAB",
      "AAABBBBBBBBBBAAB",
      "BAAAAAAAAAAAAAAB",
      "AAAAAAAAAAAAAAAB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#0a0a2a','B':'#12124a','C':'#7b68ee' }),

    // tile_moon
    tile_moon: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBABBBBBBBBBB",
      "BBBAAAAACBBBBBBB",
      "ABBAAAAABBBBBBBB",
      "BBAAAAAAABBBBBBB",
      "ABBAAAAABBBBBBBB",
      "BBBAAAAABBBBBBBB",
      "ABBBBABBBBBABBBB",
      "BBBBBBBBBBAAABBB",
      "ABBBBBBBBAAAAABB",
      "BBBBBBBBBBAAABBB",
      "ABBBBBBBBBBABBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#1a1a2a','B':'#3a3a4a','C':'#ff6347' }),

    // tile_cursed_city
    tile_cursed_city: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABAAAAABBBBBBBBB",
      "BBACAAABBBBBBBBB",
      "ABAAAAABBBBBBBBB",
      "BBAAAAABBBBBBBBB",
      "ABAAAAABBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "CCCCCCCCCCCCCCCC",
      "BBBBBBBBBAAAAABB",
      "ABBBBBBBBACAAABB",
      "BBBBBBBBBAAAAABB",
      "ABBBBBBBBAAAAABB",
      "BBBBBBBBBAAAAABB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#1a0a1a','B':'#2a1530','C':'#9400d3' }),

    // tile_star_refuge
    tile_star_refuge: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBCDBBBBBBBBBBB",
      "ABBBBBBBBBBBCDBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBCBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#0a1a2a','B':'#102840','C':'#ff8c00','D':'#ffffff' }),

    // tile_final
    tile_final: parseSprite([
      "ABABABABABABABAB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBAAAAAABBBBB",
      "ABBBBAAAAAABBBBB",
      "BBBBBAAAAAABBBBB",
      "ABBBBAAAAAABBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB",
      "ABCBCBCBCBCBCBBB",
      "BBBDBDBDBDBDBDBB",
      "ABBBBBBBBBBBBBBB",
      "BBBBBBBBBBBBBBBB"
    ], { '.':null,'A':'#0a0a1a','B':'#2a2a35','C':'#ff2200','D':'#ff6622' }),

    // decor_tree0
    decor_tree0: parseSprite([
      "........................",
      "........................",
      "........................",
      "..........AAAAA.........",
      ".......AAABAABAAAA......",
      "......AABBAAAAAAAAA.....",
      ".....AAABBAABAAAAAAB....",
      "....AAAAAAAABBAAAAAAB...",
      "...AAAAACAAAAAAAAAAAAA..",
      "...AAABAABAAABABBABAAA..",
      "..AAAAABAAABAACBAAABAAA.",
      "..BAAAAAAAAAAAAABAAAABA.",
      "..ABABBAABABAAAAABAAABA.",
      "..AAAAAAAAAAAABBABAABBA.",
      "..AAAAAAAAABAAAABAABAAA.",
      "..AAAAAAAAABAAAAAAAAAAA.",
      "...BBBAAABAABAAAAAAAAA..",
      "....AAAAABAAAAAAAAABA...",
      ".....AAABAAAAAAAABAA....",
      "......ABBBAAABAABAA.....",
      ".......BAAAABBABAB......",
      "..........BABBB.........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED.........."
    ], { '.':null,'A':'#0a4a14','B':'#063810','C':'#5dff6a','D':'#4a2a10','E':'#6a3a18' }),

    // decor_tree1
    decor_tree1: parseSprite([
      "........................",
      "........................",
      "........................",
      "..........AAAAA.........",
      ".......AAAAAAAAAAA......",
      "......ABAAAAAABAAAB.....",
      ".....AABABAAABAABAAB....",
      "....ABBAAAAAAAAAAAAAA...",
      "...AABABCABBBAAAABAAAB..",
      "...ABAABAAABAABBAAABAA..",
      "..AAAAAAAAABAACAABAAAAA.",
      "..BAAAAAABAAAABAAABABAA.",
      "..BBBABBBAAAAABABAAAAAA.",
      "..BAAAAAAAAAAABBBAAAAAA.",
      "..BABABBBABAABBAAAAAAAA.",
      "..ABAAAAAAAAAAAAAAAAAAA.",
      "...BAAABAAAAAAABAAABAA..",
      "....AAAAAAABAAABAAABA...",
      ".....AAAAABAAAAAAAAA....",
      "......AAAAAABAAAAAA.....",
      ".......AAAAAABABBA......",
      "..........BAABA.........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED.........."
    ], { '.':null,'A':'#0d5a1a','B':'#063810','C':'#5dff6a','D':'#4a2a10','E':'#6a3a18' }),

    // decor_tree2
    decor_tree2: parseSprite([
      "........................",
      "........................",
      "........................",
      "..........AAAAA.........",
      ".......AAABBABABAA......",
      "......BAABBAAABABAA.....",
      ".....AAAAABAAAABABAB....",
      "....AAABAAAAAAAAAAAAB...",
      "...AAAAACAAAAAAAAABBBA..",
      "...BAAAAAAABAAAAABAAAA..",
      "..ABAAABABAABACBAAAAAAA.",
      "..AABAAAAABAAAAAAABAAAA.",
      "..BBBAAAABABABBABAAABAA.",
      "..BAAABBBBBAAABAAAAAAAA.",
      "..ABAAAAAAAAAAABABAAABA.",
      "..BAAAAAAAAAAAAAAABAAAA.",
      "...AAAABAAAABAABABAABA..",
      "....BAAABABBAAAABBAAA...",
      ".....ABAAAAAABBABAAA....",
      "......AAAAAAABAAAAA.....",
      ".......BAAAAAABAAB......",
      "..........BAAAA.........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED..........",
      "..........DEED.........."
    ], { '.':null,'A':'#1a6a28','B':'#063810','C':'#5dff6a','D':'#4a2a10','E':'#6a3a18' }),

    // decor_mushroom
    decor_mushroom: parseSprite([
      "............",
      "............",
      ".....AAA....",
      "...AAAAAAA..",
      "..AAAAABAAA.",
      "..AABAAAAAA.",
      ".AAAAAAABAAA",
      "..AAAAAAAAA.",
      "..AAAAAAAAA.",
      "...AAAAAAA..",
      ".....AAA....",
      ".....CC.....",
      ".....CC.....",
      ".....CC....."
    ], { '.':null,'A':'#c03050','B':'#ffffff','C':'#e8d8b0' }),

    // decor_crystal
    decor_crystal: parseSprite([
      "............",
      "......A.....",
      "...AAAAAAA..",
      "...AAAAAAA..",
      "...AAABAAA..",
      "...AAAAAAA..",
      "...AAAAAAA..",
      "...AAAAAAA..",
      "...CCCCCCC..",
      "...CCCCCCC..",
      "...CCCCCCC..",
      "....CCCCC...",
      "....CCCCC...",
      "....CCCCC...",
      ".....CCC....",
      ".....CCC....",
      "............",
      "............",
      "............",
      "............"
    ], { '.':null,'A':'#88ffff','B':'#ffffff','C':'#00f5ff' }),

    // decor_pillar
    decor_pillar: parseSprite([
      "..AAAAAAAAAAAA..",
      "..AAAAAAAAAAAA..",
      ".BBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBB.",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      "....CDDCCCCC....",
      ".BBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBB.",
      ".BBBBBBBBBBBBBB.",
      "................",
      "................"
    ], { '.':null,'A':'#d4b840','B':'#ffd700','C':'#6a5840','D':'#8a7860' }),

    // decor_building
    decor_building: parseSprite([
      "............................",
      "............................",
      "............................",
      "............................",
      "..AAAAAAAAAAAAAAAAAAAAAAAA..",
      "..AAAAAAAAAAAAAAAAAAAAAAAA..",
      "..AAAAAAAAAAAAAAAAAAAAAAAA..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBCCCBBBDDDBBBDDDBBBDDD..",
      "..BBBCCCBBBDDDBBBDDDBBBDDD..",
      "..BBBCCCBBBDDDBBBDDDBBBDDD..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBDDDBBBDDDBBBDDDBBBDDD..",
      "..BBBDDDBBBDDDBBBDDDBBBDDD..",
      "..BBBDDDBBBDDDBBBDDDBBBDDD..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBDDDBBBDDDBBBDDDBBBCCC..",
      "..BBBDDDBBBDDDBBBDDDBBBCCC..",
      "..BBBDDDBBBDDDBBBDDDBBBCCC..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBDDDBBBDDDBBBCCCBBBDDD..",
      "..BBBDDDBBBDDDBBBCCCBBBDDD..",
      "..BBBDDDBBBDDDBBBCCCBBBDDD..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBDDDBBBCCCBBBDDDBBBDDD..",
      "..BBBDDDBBBCCCBBBDDDBBBDDD..",
      "..BBBDDDBBBCCCBBBDDDBBBDDD..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBBBBBB.."
    ], { '.':null,'A':'#b026ff','B':'#12082a','C':'#1a1040','D':'#ff66ff' }),

    // decor_torch
    decor_torch: parseSprite([
      "..........",
      "..........",
      ".....A....",
      "...AABAA..",
      "...AAAAA..",
      "..AACAAAA.",
      "...AAAAA..",
      "...AAAAA..",
      "....DA....",
      "....DD....",
      "....DD....",
      "....DD....",
      "....DD....",
      "....DD....",
      "....DD....",
      "....DD....",
      "....DD....",
      "....DD...."
    ], { '.':null,'A':'#ff9933','B':'#ffe088','C':'#ff4422','D':'#5a3a20' }),

    // decor_crater
    decor_crater: parseSprite([
      "....................",
      "....................",
      "........AAAAA.......",
      ".....AAAABBBAAAA....",
      "...AAABBBBBBBBBAAA..",
      "..AABBBBBBCBBBBBBAA.",
      "..ABBBBCCCCCCCBBBBA.",
      ".AABBBBCCCCCCCBBBBAA",
      ".AABBBCCCCCCCCCBBBAA",
      ".AABBBBCCCCCCCBBBBAA",
      "..ABBBBCCCCCCCBBBBA.",
      "..AABBBBBBCBBBBBBAA.",
      "...AAABBBBBBBBBAAA..",
      ".....AAAABBBAAAA....",
      "........AAAAA.......",
      "...................."
    ], { '.':null,'A':'#5a5a65','B':'#2a2a35','C':'#1a1a22' }),

    // decor_rune
    decor_rune: parseSprite([
      "................",
      ".......AAA......",
      ".....AAAAAAA....",
      "...AA.......AA..",
      "...A....B....A..",
      "..A...........A.",
      "..A...C.......A.",
      ".AA...........AA",
      ".AA.B...B...B.AA",
      ".AA...........AA",
      "..A.......C...A.",
      "..A...........A.",
      "...A....B....A..",
      "...AA.......AA..",
      ".....AAAAAAA....",
      ".......AAA......"
    ], { '.':null,'A':'#7b68ee','B':'#c0b0ff','C':'#ffffff' }),

    // decor_portal
    decor_portal: parseSprite([
      "....................",
      "....................",
      ".........AAA........",
      ".......AAAAAAA......",
      ".....AAA.....AAA....",
      ".....AA..BBB..AA....",
      "....AA..BBBBB..AA...",
      "...AA..B.....B..AA..",
      "...AA.B...C...B.AA..",
      "...A..B.CCCCC.B..A..",
      "..AA..B.CCCCC.B..AA.",
      "..AA.B..CCCCC..B.AA.",
      "..AA.B.CCCDCCC.B.AA.",
      "..AA.B..CCCCC..B.AA.",
      "..AA..B.CCCCC.B..AA.",
      "...A..B.CCCCC.B..A..",
      "...AA.B...C...B.AA..",
      "...AA..B.....B..AA..",
      "....AA..BBBBB..AA...",
      ".....AA..BBB..AA....",
      ".....AAA.....AAA....",
      ".......AAAAAAA......",
      ".........AAA........",
      "...................."
    ], { '.':null,'A':'#7b68ee','B':'#a090ff','C':'#201060','D':'#ffffff' }),

    // decor_rock
    decor_rock: parseSprite([
      "..................",
      "..................",
      "..................",
      "........AAA.......",
      "....AABAAABBABA...",
      "...AAABAAAAABAAB..",
      "..BAAACBBAABBAAAA.",
      ".AAAABAABAAAABABAA",
      ".ABBAAAAAAABAAAAAA",
      ".AAAAABBAABAAAAAAA",
      "..BAAAAAAAAAAABBA.",
      "...AABAAAAAAABAA..",
      "....AAAAAAAAAAA...",
      "........AAA......."
    ], { '.':null,'A':'#4a4a55','B':'#2a2a35','C':'#7a7a88' }),

    // decor_spire
    decor_spire: parseSprite([
      "..AAAAAABAAAAA..",
      "..AAAAAAAAAAAA..",
      "..AAAAAAAAAAAA..",
      "...AAAAAAAAAA...",
      "...AAAAAAAAAA...",
      "...AAAAAAAAAA...",
      "...CCCCCCCCCC...",
      "....CCCCCCCC....",
      "....CCCCCCCC....",
      "....CCCCCCCC....",
      "....CCCCCCCC....",
      ".....CCCCCC.....",
      ".....CCCCCC.....",
      ".....CCCCCC.....",
      ".....CCCCCC.....",
      "......CCCC......",
      "......CCCC......",
      "......CCCC......",
      "......CCCC......",
      ".......CC.......",
      ".......CC.......",
      ".......CC.......",
      ".......CC.......",
      ".......CC.......",
      ".......CC.......",
      ".......CC.......",
      "................",
      "................"
    ], { '.':null,'A':'#8a8aa0','B':'#ffd700','C':'#5a5a70' }),

    // decor_ruin
    decor_ruin: parseSprite([
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "........................",
      "..AAAAAAAAAAAAAAAAAAAA..",
      "..AAAAAAAAAAAAAAAAAAAA..",
      "..BBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBB..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBCCCBBCCCBBCCCBBCCC..",
      "..BBBBBBBBBBBBBBBBBBBB..",
      "..BBBBBBBBBBBBBBBBBBBB.."
    ], { '.':null,'A':'#5a3560','B':'#3a2540','C':'#2a1530' }),

    // decor_altar
    decor_altar: parseSprite([
      "..................",
      "..................",
      "..................",
      "..................",
      "......AAAAAA......",
      ".....AAAABAAAA....",
      "....A.AAAAAA..A...",
      "...A..AACACA...A..",
      "..AA..AAAAAA...AA.",
      "..AA..AAAAAA...AA.",
      "..AA...........AA.",
      "...A...........A..",
      "....A.........A...",
      ".....AAA...AAA....",
      "........AAA.......",
      ".................."
    ], { '.':null,'A':'#ff8c00','B':'#ffffff','C':'#ffd080' }),

    // decor_holo
    decor_holo: parseSprite([
      "....................",
      "....................",
      ".........AAA........",
      "......AAAAAAAAA.....",
      ".....AA.......AA....",
      "....AA.........AA...",
      "...AA.....B.....AA..",
      "...A....B...B....A..",
      "...A...B.....B...A..",
      "..AA.............AA.",
      "..AA..B...C...B..AA.",
      "..AA.............AA.",
      "...A...B.....B...A..",
      "...A....B...B....A..",
      "...AA.....B.....AA..",
      "....AA.........AA...",
      ".....AA.......AA....",
      "......AAAAAAAAA.....",
      ".........AAA........",
      "...................."
    ], { '.':null,'A':'#00f5ff','B':'#88ffff','C':'#ffffff' }),

    // decor_target
    decor_target: parseSprite([
      "........A.......",
      ".......AAA......",
      ".....AAAAAAA....",
      "...AA...A...AA..",
      "...A....A....A..",
      "..A.....A.....A.",
      "..A...A.A.A...A.",
      ".AA.....A.....AA",
      "AAAAAAAAAAAAAAAA",
      ".AA.....A.....AA",
      "..A...A.A.A...A.",
      "..A.....A.....A.",
      "...A....A....A..",
      "...AA...A...AA..",
      ".....AAAAAAA....",
      ".......AAA......"
    ], { '.':null,'A':'#00f5ff' }),

    // decor_neon
    decor_neon: parseSprite([
      "........................",
      "........................",
      "....A.......A...........",
      ".BBBBBBBBBBBBBBBBBBBBBB.",
      ".BCCCCCCCCCCCCCCCCCCCCB.",
      ".BCCCCCCCCCCCCCCCCCCCCB.",
      ".BBBBBBBBBBBBBBBBBBBBBB.",
      "........................",
      "........................",
      "........................"
    ], { '.':null,'A':'#ffffff','B':'#b026ff','C':'#ff66ff' }),

    // decor_lava
    decor_lava: parseSprite([
      "....................",
      "........AAAAA.......",
      ".....AAAAAAAAAAA....",
      "...AAAAAABBBAAAAAA..",
      "..AAAABBBBBBBBBAAAA.",
      ".AAAABBBCBBBBBBBAAAA",
      ".AAABBBBBBBBCBBBBAAA",
      ".AAAABBBBBBBBBBBAAAA",
      "..AAAABBBBBBBBBAAAA.",
      "...AAAAAABBBAAAAAA..",
      ".....AAAAAAAAAAA....",
      "........AAAAA......."
    ], { '.':null,'A':'#5a1510','B':'#ff4422','C':'#ffaa44' }),

    // decor_stalactite
    decor_stalactite: parseSprite([
      "..AAAAAAAA..",
      "..AAAAAAAA..",
      "..AAAAAAAA..",
      "...AAAAAA...",
      "...AAAAAA...",
      "...AAAAAA...",
      "...AAAAAA...",
      "...AAAAAA...",
      "....AAAA....",
      "....AAAA....",
      "....AAAA....",
      "....AAAA....",
      "....AAAA....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      ".....AA.....",
      "............",
      "............"
    ], { '.':null,'A':'#4a2020' }),

    // decor_flag
    decor_flag: parseSprite([
      "..AA..........",
      "..AABBBBBBBBB.",
      "..AABBBBBBBBB.",
      "..AABBCBBBBBB.",
      "..AABBBBCBBBB.",
      "..AABBBBBBBBB.",
      "..AABBBBBBBBB.",
      "..AABBBBBBBBB.",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA..........",
      "..AA.........."
    ], { '.':null,'A':'#888888','B':'#dddddd','C':'#ff2200' }),

    // decor_fog
    decor_fog: parseSprite([
      "........................",
      "..........AAAAA.........",
      ".....AAAAAAAAAAAAAAA....",
      "...AAAAAAAAAAAAAAAAAAA..",
      "..AAAAAAAAAAAAAAAAAAAAA.",
      ".AAAAAAAAAAAAAAAAAAAAAAA",
      ".AAAAAAAAAAAAAAAAAAAAAAA",
      ".AAAAAAAAAAAAAAAAAAAAAAA",
      "..AAAAAAAAAAAAAAAAAAAAA.",
      "...AAAAAAAAAAAAAAAAAAA..",
      ".....AAAAAAAAAAAAAAA....",
      "..........AAAAA........."
    ], { '.':null,'A':'#6a3088' }),

    // decor_vine
    decor_vine: parseSprite([
      "....A.....",
      "....A.....",
      "....A.....",
      ".....A....",
      ".....A....",
      ".....A....",
      "...BA.....",
      "....A.....",
      "....A.....",
      ".....A....",
      ".....A....",
      ".....A....",
      "....A.....",
      "....A.....",
      "....A.B...",
      ".....A....",
      ".....A....",
      ".....A....",
      "....A.....",
      "....A.....",
      "....A.....",
      ".....A....",
      ".....A....",
      ".....A...."
    ], { '.':null,'A':'#1a5a1a','B':'#2a8a2a' })
  };

  function drawSprite(ctx, sprite, x, y, scale, flipX) {
    if (!sprite) return;
    const s = scale || PX;
    const dw = sprite.w * s;
    const dh = sprite.h * s;
    ctx.imageSmoothingEnabled = false;
    if (sprite.canvas) {
      ctx.save();
      if (flipX) {
        ctx.translate(x + dw, y);
        ctx.scale(-1, 1);
        ctx.drawImage(sprite.canvas, 0, 0, sprite.w, sprite.h, 0, 0, dw, dh);
      } else {
        ctx.drawImage(sprite.canvas, 0, 0, sprite.w, sprite.h, x, y, dw, dh);
      }
      ctx.restore();
      return;
    }
    const { w, pixels } = sprite;
    for (let i = 0; i < pixels.length; i++) {
      const color = pixels[i];
      if (!color) continue;
      const col = i % w;
      const row = Math.floor(i / w);
      const drawCol = flipX ? (w - 1 - col) : col;
      ctx.fillStyle = color;
      ctx.fillRect(x + drawCol * s, y + row * s, s, s);
    }
  }

  function drawSpriteCentered(ctx, sprite, cx, cy, scale, facingLeft) {
    if (!sprite) return;
    const s = scale || PX;
    drawSprite(ctx, sprite, cx - (sprite.w * s) / 2, cy - (sprite.h * s) / 2, s, facingLeft);
  }

  function drawPixelCircle(ctx, cx, cy, r, color) {
    ctx.fillStyle = color;
    const rr = Math.max(1, Math.round(r));
    for (let y = -rr; y <= rr; y++) {
      for (let x = -rr; x <= rr; x++) {
        if (x * x + y * y <= rr * rr) ctx.fillRect(Math.round(cx) + x, Math.round(cy) + y, 1, 1);
      }
    }
  }

  window.PixelSprites = { SPRITES, PX, drawSprite, drawSpriteCentered, drawPixelCircle, bakeSprite };
})();
