// assets-config.js (v5)

window.CATALOG = {
  llamaBase: "https://i.imgur.com/zgQ8490.png",

  hats: [
    { key:"cool_hat",  name:"Cool Hat",
      thumb:"https://i.imgur.com/r6L0Yg1.png", image:"https://i.imgur.com/r6L0Yg1.png",
      cost:{coins:20}, slot:"hat" },
    { key:"silly_hat", name:"Silly Hat",
      thumb:"https://i.imgur.com/1uG1sJh.png", image:"https://i.imgur.com/tWUl2Iz.png",
      cost:{coins:14}, slot:"hat" },
  ],

  neckwear: [
    { key:"cool_neck",  name:"Cool Necktie",
      thumb:"https://i.imgur.com/BfDS7mI.png", image:"https://i.imgur.com/X4wSwdR.png",
      cost:{coins:12}, slot:"neck" },
    { key:"silly_neck", name:"Silly Neck Accessory",
      thumb:"https://i.imgur.com/rRoOY9E.png", image:"https://i.imgur.com/wYOH3ah.png",
      cost:{coins:10}, slot:"neck" },
  ],

  pants: [
    { key:"cool_pants",  name:"Cool Pants",
      thumb:"https://i.imgur.com/lzPAKyL.png", image:"https://i.imgur.com/O2sMwsc.png",
      cost:{coins:18}, slot:"pants" },
    { key:"silly_pants", name:"Silly Pants",
      thumb:"https://i.imgur.com/A6gfUej.png", image:"https://i.imgur.com/1z0ZDVZ.png",
      cost:{coins:15}, slot:"pants" },
  ],

  shoes: [
    { key:"cool_shoes",  name:"Cool Shoes",
      thumb:"https://i.imgur.com/YrmbXe9.png", image:"https://i.imgur.com/90C8TNe.png",
      cost:{coins:14}, slot:"shoes" },
    { key:"silly_shoes", name:"Silly Shoes",
      thumb:"https://i.imgur.com/K0GUBle.png", image:"https://i.imgur.com/xooykYg.png",
      cost:{coins:12}, slot:"shoes" },
  ],

  accessories: [
    { key:"sunglasses", name:"Sunglasses",
      thumb:"https://i.imgur.com/3PCFnWc.png", image:"https://i.imgur.com/UZ6jX96.png",
      cost:{coins:10}, slot:"accessory" },
    { key:"cell_phone", name:"Cellphone",
      thumb:"https://i.imgur.com/QLyFZPb.png", image:"https://i.imgur.com/zvjSDcX.png",
      cost:{coins:10}, slot:"accessory" },
    { key:"iced_coffee", name:"Iced Coffee",
      thumb:"https://i.imgur.com/gzk37Mh.png", image:"https://i.imgur.com/EbJ63wc.png",
      cost:{coins:10}, slot:"accessory" },
    { key:"tote_bag", name:"Tote Bag",
      thumb:"https://i.imgur.com/xGRXCEX.png", image:"https://i.imgur.com/yE5XauC.png",
      cost:{coins:10}, slot:"accessory" },
    { key:"protein_shaker", name:"Protein Shaker",
      thumb:"https://i.imgur.com/DH1H5c1.png", image:"https://i.imgur.com/dqSy2Ji.png",
      cost:{coins:8}, slot:"accessory" },
    { key:"mustache", name:"Mustache",
      thumb:"https://i.imgur.com/f2RKF47.png", image:"https://i.imgur.com/kngbJ8M.png",
      cost:{coins:6}, slot:"accessory" },
  ],

  background: [
    { key:"bg_meadow", name:"Meadow",    thumbCSS:"linear-gradient(135deg,#86efac,#60a5fa)", bgCSS:"linear-gradient(135deg,#a7f3d0,#60a5fa)" },
    { key:"bg_office", name:"Office",    thumbCSS:"linear-gradient(135deg,#cbd5e1,#94a3b8)", bgCSS:"linear-gradient(135deg,#e5e7eb,#94a3b8)" },
    { key:"bg_night",  name:"Night Sky", thumbCSS:"linear-gradient(135deg,#0ea5e9,#111827)", bgCSS:"linear-gradient(135deg,#0ea5e9,#111827)" },
  ],

  food: {
    hay:      { key:"hay",      label:"Hay",      emoji:"🌾", hunger:20, happiness:2, cost:5 },
    carrot:   { key:"carrot",   label:"Carrot",   emoji:"🥕", hunger:15, happiness:5, cost:8 },
    espresso: { key:"espresso", label:"Espresso", emoji:"☕", hunger:0,  happiness:8, cost:10 }
  },

  pets: [
    { key:"mini_alpaca", label:"Mini Alpaca 🍼", cost:30, buff:"+1 coin on path complete" },
    { key:"pika",        label:"Pika 🐭",        cost:28, buff:"+1 XP on feed" },
    { key:"quokka",      label:"Quokka 🙂",      cost:26, buff:"+1 happiness on mood check-in" }
  ]
};

// ✨ Town catalog (now with emoji, color & descriptions for the new UI)
window.BUILDINGS = [
  { key:"networking_center", name:"Networking Center", emoji:"🗣️",
    cost:40, mins:0.25, color:"#22d3ee", bg:"linear-gradient(135deg,#0ea5e9,#22d3ee)",
    desc:"Unlocks team chat & gifting.", unlocks:["chat","gifting"], rareDrop:"sunglasses" },

  { key:"market", name:"Market", emoji:"🛒",
    cost:30, mins:0.25, color:"#22c55e", bg:"linear-gradient(135deg,#34d399,#22c55e)",
    desc:"Buy food to keep your llama happy.", unlocks:["food"], rareDrop:"protein_shaker" },

  { key:"outfitters", name:"Outfitters", emoji:"👗",
    cost:30, mins:0.25, color:"#a78bfa", bg:"linear-gradient(135deg,#8b5cf6,#a78bfa)",
    desc:"Access hats, neckwear, pants & shoes.", unlocks:["shop:hats","shop:neckwear","shop:pants","shop:shoes"], rareDrop:"cool_hat" },

  { key:"photo_booth", name:"Photo Booth", emoji:"📸",
    cost:25, mins:0.25, color:"#60a5fa", bg:"linear-gradient(135deg,#60a5fa,#0ea5e9)",
    desc:"Change backgrounds & share looks.", unlocks:["backgrounds"], rareDrop:"mustache" },

  { key:"pet_shelter", name:"Pet Shelter", emoji:"🐾",
    cost:45, mins:0.25, color:"#f472b6", bg:"linear-gradient(135deg,#fb7185,#f472b6)",
    desc:"Adopt a helper pet with tiny buffs.", unlocks:["pets"] },

  { key:"gym", name:"Gym", emoji:"🏋️",
    cost:35, mins:0.25, color:"#ef4444", bg:"linear-gradient(135deg,#ef4444,#f59e0b)",
    desc:"Slightly more happiness when feeding.", unlocks:["buff:gym"] },

  { key:"roastery", name:"Coffee Roastery", emoji:"☕",
    cost:25, mins:0.25, color:"#f59e0b", bg:"linear-gradient(135deg,#f59e0b,#fde047)",
    desc:"Extra boost from espresso.", unlocks:["buff:espresso"] },

  { key:"music_stage", name:"Music Stage", emoji:"🎵",
    cost:40, mins:0.25, color:"#38bdf8", bg:"linear-gradient(135deg,#22d3ee,#38bdf8)",
    desc:"Unlocks llama petting mini-perk.", unlocks:["perk:petting"] },

  { key:"workshop", name:"Workshop", emoji:"🛠️",
    cost:30, mins:0.25, color:"#94a3b8", bg:"linear-gradient(135deg,#94a3b8,#cbd5e1)",
    desc:"Salvage: convert extras to coins.", unlocks:["perk:salvage"] },

  { key:"bank", name:"Bank", emoji:"🏦",
    cost:60, mins:0.25, color:"#10b981", bg:"linear-gradient(135deg,#10b981,#34d399)",
    desc:"Tiny daily interest on coins.", unlocks:["perk:interest"] },

  { key:"arcade", name:"Arcade", emoji:"🕹️",
    cost:50, mins:0.25, color:"#f43f5e", bg:"linear-gradient(135deg,#f43f5e,#a855f7)",
    desc:"Bigger confetti & bonus on path complete.", unlocks:["perk:celebration"] },

  { key:"observatory", name:"Observatory", emoji:"🔭",
    cost:35, mins:0.25, color:"#60a5fa", bg:"linear-gradient(135deg,#4f46e5,#60a5fa)",
    desc:"Occasional mini-quest prompts.", unlocks:["perk:quest"] }
];
