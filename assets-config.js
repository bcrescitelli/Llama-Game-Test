
/* ==== IMAGES & CATALOG (uses your exact TN links; falls back to full image if TN missing/invalid) ==== */
window.CATALOG = {
  llamaBase: "https://i.imgur.com/zgQ8490.png",

  hats: [
    { key:"cool_hat",  name:"Cool Hat",
      thumb:"https://i.imgur.com/r6L0Yg1.png", image:"https://i.imgur.com/r6L0Yg1.png",
      cost:{coins:20}, slot:"hat",  offset:{x:0,y:-100,scale:1,rotate:0} },
    { key:"silly_hat", name:"Silly Hat",
      thumb:"https://i.imgur.com/1uG1sJh.png", image:"https://i.imgur.com/tWUl2Iz.png",
      cost:{coins:14}, slot:"hat",  offset:{x:0,y:-100,scale:1,rotate:0} },
  ],

  neckwear: [
    { key:"cool_neck",  name:"Cool Necktie",
      thumb:"https://i.imgur.com/BfDS7mI.png", image:"https://i.imgur.com/X4wSwdR.png",
      cost:{coins:12}, slot:"neck", offset:{x:0,y:18,scale:1,rotate:0} },
    { key:"silly_neck", name:"Silly Neck Accessory",
      thumb:"https://i.imgur.com/rRoOY9E.png", image:"https://i.imgur.com/wYOH3ah.png",
      cost:{coins:10}, slot:"neck", offset:{x:0,y:18,scale:1,rotate:0} },
  ],

  pants: [
    { key:"cool_pants",  name:"Cool Pants",
      thumb:"https://i.imgur.com/lzPAKyL.png", image:"https://i.imgur.com/O2sMwsc.png",
      cost:{coins:18}, slot:"pants", offset:{x:0,y:75,scale:1,rotate:0} },
    { key:"silly_pants", name:"Silly Pants",
      thumb:"https://i.imgur.com/A6gfUej.png", image:"https://i.imgur.com/1z0ZDVZ.png",
      cost:{coins:15}, slot:"pants", offset:{x:0,y:75,scale:1,rotate:0} },
  ],

  shoes: [
    { key:"cool_shoes",  name:"Cool Shoes",
      thumb:"https://i.imgur.com/YrmbXe9.png", image:"https://i.imgur.com/90C8TNe.png",
      cost:{coins:14}, slot:"shoes", offset:{x:0,y:120,scale:1,rotate:0} },
    { key:"silly_shoes", name:"Silly Shoes",
      thumb:"https://i.imgur.com/K0GUBle.png", image:"https://i.imgur.com/xooykYg.png",
      cost:{coins:12}, slot:"shoes", offset:{x:0,y:120,scale:1,rotate:0} },
  ],

  accessories: [
    { key:"sunglasses", name:"Sunglasses",
      thumb:"https://i.imgur.com/3PCFnWc.png", image:"https://i.imgur.com/UZ6jX96.png",
      cost:{coins:10}, slot:"accessory", offset:{x:0,y:-12,scale:1,rotate:0} },
    { key:"cell_phone", name:"Cellphone",
      thumb:"https://i.imgur.com/QLyFZPb.png", image:"https://i.imgur.com/zvjSDcX.png",
      cost:{coins:10}, slot:"accessory", offset:{x:40,y:40,scale:1,rotate:0} },
    { key:"iced_coffee", name:"Iced Coffee",
      thumb:"https://i.imgur.com/gzk37Mh.png", image:"https://i.imgur.com/EbJ63wc.png",
      cost:{coins:10}, slot:"accessory", offset:{x:-40,y:45,scale:1,rotate:0} },
    { key:"tote_bag", name:"Tote Bag",
      thumb:"https://i.imgur.com/xGRXCEX.png", image:"https://i.imgur.com/yE5XauC.png",
      cost:{coins:10}, slot:"accessory", offset:{x:-10,y:50,scale:1,rotate:0} },
    { key:"protein_shaker", name:"Protein Shaker",
      thumb:"https://i.imgur.com/DH1H5c1.png", image:"https://i.imgur.com/dqSy2Ji.png",
      cost:{coins:8}, slot:"accessory", offset:{x:30,y:55,scale:1,rotate:0} },
    { key:"mustache", name:"Mustache",
      thumb:"https://i.imgur.com/f2RKF47.png", image:"https://i.imgur.com/kngbJ8M.png",
      cost:{coins:6}, slot:"accessory", offset:{x:0,y:-2,scale:1,rotate:0} },
  ],

  background: [
    { key:"bg_meadow", name:"Meadow",     thumbCSS:"linear-gradient(135deg,#86efac,#60a5fa)", bgCSS:"linear-gradient(135deg,#a7f3d0,#60a5fa)" },
    { key:"bg_office", name:"Office",     thumbCSS:"linear-gradient(135deg,#cbd5e1,#94a3b8)", bgCSS:"linear-gradient(135deg,#e5e7eb,#94a3b8)" },
    { key:"bg_night",  name:"Night Sky",  thumbCSS:"linear-gradient(135deg,#0ea5e9,#111827)", bgCSS:"linear-gradient(135deg,#0ea5e9,#111827)" },
  ],

  food: {
    hay:      { key:"hay",      label:"Hay",      emoji:"🌾", hunger:20, happiness:2, cost:5 },
    carrot:   { key:"carrot",   label:"Carrot",   emoji:"🥕", hunger:15, happiness:5, cost:8 },
    espresso: { key:"espresso", label:"Espresso", emoji:"☕", hunger:0,  happiness:8, cost:10 }
  }
};

/* ==== BUILDINGS (same as before) ==== */
window.BUILDINGS = [
  { key:"networking_center", name:"Networking Center", cost:40, mins:25, unlocks:["chat","gifting"], rareDrop:"sunglasses" },
  { key:"market",            name:"Market",            cost:30, mins:25, unlocks:["food"],           rareDrop:"protein_shaker" },
  { key:"outfitters",        name:"Outfitters",        cost:30, mins:25, unlocks:["shop:hats","shop:neckwear","shop:pants","shop:shoes"], rareDrop:"cool_hat" },
  { key:"photo_booth",       name:"Photo Booth",       cost:25, mins:25, unlocks:["backgrounds"],    rareDrop:"mustache" },
  { key:"gym",               name:"Gym",               cost:35, mins:25, unlocks:["buff:gym"] },
  { key:"roastery",          name:"Coffee Roastery",   cost:25, mins:25, unlocks:["buff:espresso"] },
  { key:"music_stage",       name:"Music Stage",       cost:40, mins:25, unlocks:["perk:petting"] },
  { key:"workshop",          name:"Workshop",          cost:30, mins:25, unlocks:["perk:salvage"] },
  { key:"bank",              name:"Bank",              cost:60, mins:25, unlocks:["perk:interest"] },
  { key:"arcade",            name:"Arcade",            cost:50, mins:25, unlocks:["perk:celebration"] },
  { key:"observatory",       name:"Observatory",       cost:35, mins:25, unlocks:["perk:quest"] },
  { key:"pet_shelter",       name:"Pet Shelter",       cost:45, mins:25, unlocks:["perk:pet"] },
];

