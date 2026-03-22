import { useState, useRef, useCallback, useEffect, useMemo } from "react";

/* ═══ DATA ═══ */
var CATS = {
  industrial: { color: "#E59500", label: "Industrial" },
  agriculture: { color: "#22C55E", label: "Agriculture" },
  residential: { color: "#3B82F6", label: "Residential" },
  religious: { color: "#A855F7", label: "Religious" },
  commerce: { color: "#EF4444", label: "Commerce" },
  nature: { color: "#10B981", label: "Nature" },
  structure: { color: "#8B95A5", label: "Structure" },
  newshores: { color: "#F59E0B", label: "New Shores" },
};

// Radius: relative to footprint per Strategy Bible. 1x~20, 2x~30, 3.5x~45, 4x~55, 5x~65, 7x~70, 10x~80, 20x~130
// Base scores & self-penalties verified against Strategy Bible (2019+CU1), Knoef Console Guide, Piel 2025
var BD = {
  lumberjack:     { n:"Lumberjack",     c:"industrial",  b:0,   s:-6,   r:80,  w:1,   h:1,   i:"\u{1FA93}", t:"grass" },
  sawmill:        { n:"Sawmill",        c:"industrial",  b:0,   s:-12,  r:55,  w:2,   h:1.4, i:"\u{1FA9A}", t:"any" },
  brickyard:      { n:"Brickyard",      c:"industrial",  b:6,   s:-8,   r:55,  w:2,   h:1.4, i:"\u{1F9F1}", t:"any" },
  sandpit:        { n:"Sandpit",        c:"industrial",  b:9,   s:-3,   r:80,  w:1.8, h:1,   i:"\u231B",    t:"sand" },
  mason:          { n:"Mason",          c:"industrial",  b:9,   s:-4,   r:55,  w:1,   h:1,   i:"\u26CF\uFE0F", t:"cliff" },
  goldmine:       { n:"Gold Mine",      c:"industrial",  b:-20, s:0,    r:20,  w:1.2, h:1.2, i:"\u{1F4B0}", t:"vein" },
  warehouse:      { n:"Warehouse",      c:"industrial",  b:0,   s:-15,  r:65,  w:2.5, h:1.6, i:"\u{1F4E6}", t:"any" },
  mill:           { n:"Mill",           c:"agriculture", b:8,   s:-20,  r:70,  w:1.4, h:2,   i:"\u{1F33E}", t:"any" },
  field:          { n:"Field",          c:"agriculture", b:3,   s:2,    r:30,  w:2,   h:1,   i:"\u{1F331}", t:"grass" },
  hopfield:       { n:"Hop Field",      c:"agriculture", b:5,   s:2,    r:40,  w:2,   h:1,   i:"\u{1F37A}", t:"grass" },
  brewery:        { n:"Brewery",        c:"agriculture", b:3,   s:-11,  r:45,  w:1.8, h:1.6, i:"\u{1F37B}", t:"any" },
  seaweedfield:   { n:"Seaweed Fld",    c:"agriculture", b:-1,  s:1,    r:30,  w:1.8, h:0.8, i:"\u{1F33F}", t:"water" },
  seaweedfarm:    { n:"Seaweed Frm",    c:"agriculture", b:10,  s:-24,  r:30,  w:1.6, h:1.4, i:"\u{1F3ED}", t:"coast" },
  fisher:         { n:"Fisher",         c:"nature",      b:4,   s:-11,  r:80,  w:1.2, h:1,   i:"\u{1F41F}", t:"water" },
  citycenter:     { n:"City Center",    c:"residential", b:15,  s:-40,  r:65,  w:2.8, h:2.2, i:"\u{1F3DB}\uFE0F", t:"any" },
  house:          { n:"House",          c:"residential", b:1,   s:1,    r:40,  w:1,   h:1,   i:"\u{1F3E0}", t:"any" },
  mansion:        { n:"Mansion",        c:"residential", b:1,   s:1,    r:20,  w:1.4, h:1.4, i:"\u{1F3F0}", t:"any" },
  hut:            { n:"Hut",            c:"residential", b:4,   s:0,    r:80,  w:0.8, h:0.8, i:"\u{1F6D6}", t:"any" },
  fountain:       { n:"Fountain",       c:"nature",      b:0,   s:-15,  r:55,  w:1,   h:1,   i:"\u26F2",    t:"any" },
  circus:         { n:"Circus",         c:"commerce",    b:0,   s:-10,  r:30,  w:2.2, h:2,   i:"\u{1F3AA}", t:"any" },
  tavern:         { n:"Tavern",         c:"commerce",    b:-15, s:-15,  r:65,  w:1.6, h:1.4, i:"\u{1F377}", t:"any" },
  market:         { n:"Market",         c:"commerce",    b:-20, s:-35,  r:55,  w:2.8, h:1.8, i:"\u{1F3EA}", t:"any" },
  jewelry:        { n:"Jewelry",        c:"commerce",    b:-35, s:-30,  r:65,  w:1.2, h:1.2, i:"\u{1F48E}", t:"any" },
  tower:          { n:"Tower",          c:"structure",   b:0,   s:-30,  r:130, w:0.8, h:1.8, i:"\u{1F5FC}", t:"any" },
  fishkite:       { n:"Fish Kite",      c:"commerce",    b:-15, s:-45,  r:90,  w:1,   h:1.4, i:"\u{1F3CF}", t:"any", ns:true },
  park:           { n:"Park",           c:"nature",      b:2,   s:0,    r:55,  w:2,   h:1.6, i:"\u{1F333}", t:"any" },
  shaman:         { n:"Shaman",         c:"religious",   b:0,   s:-13,  r:25,  w:1,   h:1,   i:"\u{1F52E}", t:"any" },
  statue:         { n:"Statue",         c:"religious",   b:15,  s:-25,  r:80,  w:1,   h:1.6, i:"\u{1F5FF}", t:"any" },
  temple:         { n:"Temple",         c:"religious",   b:-75, s:0,    r:20,  w:3,   h:3,   i:"\u26E9\uFE0F", t:"any" },
  monument:       { n:"Monument",       c:"religious",   b:-15, s:-100, r:30,  w:1.6, h:2.4, i:"\u{1F3D7}\uFE0F", t:"any" },
  resortoasis:    { n:"Resort Oasis",   c:"commerce",    b:0,   s:0,    r:40,  w:2.2, h:1.6, i:"\u{1F3DD}\uFE0F", t:"any" },
  wall:           { n:"Wall",           c:"structure",   b:2,   s:-12,  r:40,  w:2.4, h:0.6, i:"\u{1F9F1}", t:"any" },
  plateau:        { n:"Plateau",        c:"structure",   b:0,   s:4,    r:35,  w:2.2, h:1.8, i:"\u{1F3D4}\uFE0F", t:"any" },
  wallplateau:    { n:"Wall Plateau",   c:"structure",   b:10,  s:1,    r:40,  w:2.2, h:1.2, i:"\u{1FAA8}", t:"cliff" },
  waterplateau:   { n:"Water Plat.",    c:"structure",   b:13,  s:1,    r:40,  w:2.2, h:1.2, i:"\u{1F30A}", t:"water" },
  cliffhouse:     { n:"Cliff House",    c:"newshores",   b:2,   s:1,    r:25,  w:1,   h:1,   i:"\u{1F3DA}\uFE0F", t:"cliff", ns:true },
  hermitage:      { n:"Hermitage",      c:"newshores",   b:-10, s:-20,  r:70,  w:1.2, h:1.4, i:"\u{1F9D8}", t:"any", ns:true },
  terrace:        { n:"Terrace",        c:"newshores",   b:0,   s:2,    r:150, w:2.2, h:1,   i:"\u{1FA9C}", t:"any", ns:true },
  pyre:           { n:"Pyre",           c:"newshores",   b:0,   s:5,    r:55,  w:0.8, h:1,   i:"\u{1F525}", t:"any", ns:true },
  guildhall:      { n:"Guild Hall",     c:"newshores",   b:-10, s:-30,  r:50,  w:2.4, h:2,   i:"\u{1F3DB}", t:"any", ns:true },
  mountainshrine: { n:"Mtn Shrine",     c:"newshores",   b:5,   s:-15,  r:40,  w:1.2, h:1.6, i:"\u26F0\uFE0F", t:"cliff", ns:true },
  lighthouse:     { n:"Lighthouse",     c:"newshores",   b:0,   s:-20,  r:90,  w:0.8, h:2,   i:"\u{1F4A1}", t:"coast", ns:true },
  harbor:         { n:"Harbor",         c:"newshores",   b:5,   s:-15,  r:50,  w:2.4, h:1.6, i:"\u2693",    t:"coast", ns:true },
  dock:           { n:"Dock",           c:"newshores",   b:2,   s:-5,   r:35,  w:2,   h:0.8, i:"\u{1F6A2}", t:"water", ns:true },
  fortuneteller:  { n:"Fortune Teller", c:"newshores",   b:-20, s:-25,  r:65,  w:1.4, h:1.4, i:"\u{1F52E}", t:"any", ns:true },
};

var ADJ = {
  lumberjack:{sawmill:5,statue:4},sawmill:{lumberjack:7,warehouse:6,statue:4},
  brickyard:{mason:5,warehouse:4,sandpit:4,statue:3},sandpit:{brickyard:3,statue:3},
  mason:{brickyard:4,statue:3,warehouse:3,tower:2,market:2,citycenter:2,plateau:2,temple:2,wall:2},
  goldmine:{warehouse:10,jewelry:10,statue:5},
  warehouse:{market:7,goldmine:7,mill:7,fisher:6,brickyard:6,mason:5,brewery:5,sawmill:4,statue:4,seaweedfarm:4},
  mill:{statue:5,warehouse:5,field:4,citycenter:3,mason:2},
  field:{mill:5,statue:5,plateau:3,resortoasis:3,field:2},
  hopfield:{statue:4,brewery:4,resortoasis:3,hopfield:2},
  brewery:{hopfield:5,statue:4,warehouse:2,seaweedfarm:2},
  seaweedfield:{seaweedfarm:9,plateau:4,statue:3,seaweedfield:1},
  seaweedfarm:{seaweedfield:4,statue:3},
  fisher:{citycenter:7,warehouse:2,statue:2,hut:1,seaweedfield:1,harbor:3},
  citycenter:{fisher:7,statue:5,mason:4,mill:2,seaweedfarm:2},
  house:{citycenter:6,shaman:5,statue:4,plateau:3,wallplateau:3,circus:3,fountain:2,market:2,temple:2,tavern:2,tower:2,mason:2,park:1,house:1},
  mansion:{citycenter:8,shaman:6,plateau:6,wallplateau:6,statue:5,fountain:3,park:2,market:2,tower:2,temple:2,jewelry:2,mansion:1},
  hut:{citycenter:6,statue:2,shaman:2,fisher:1,seaweedfarm:1},
  fountain:{citycenter:7,statue:3,park:3,mansion:3,house:2},
  circus:{statue:10,house:4},tavern:{brewery:18,citycenter:8,statue:4,house:2},
  market:{warehouse:20,citycenter:5,mason:4,statue:4,fisher:3,house:2,mansion:2},
  jewelry:{goldmine:30,statue:6,mansion:5},
  tower:{temple:8,mason:5,fishkite:5,statue:4,wall:1,house:1,park:1,mansion:1},
  fishkite:{resortoasis:15,market:15,tower:15,circus:15,statue:10},
  park:{resortoasis:5,fountain:4,temple:4,hopfield:3,tower:3,field:2,plateau:2,statue:2,citycenter:2,house:1,mansion:1},
  shaman:{statue:5,temple:5,seaweedfield:2},statue:{},
  temple:{statue:40,plateau:25,mason:25,shaman:15,citycenter:10,tower:10,mansion:10,wall:10,house:8,park:5},
  monument:{temple:20,citycenter:15,park:8,statue:4},
  resortoasis:{hopfield:7,plateau:6,waterplateau:5,park:5,fountain:5,statue:4,field:3,fisher:2,brewery:2},
  wall:{temple:10,market:7,jewelry:7,citycenter:6,warehouse:6,statue:4,plateau:4,park:3,mason:3,house:3,mansion:3,hut:1},
  plateau:{citycenter:10,mason:8,plateau:4,statue:2,seaweedfield:1},
  wallplateau:{citycenter:4,statue:2,wallplateau:1},waterplateau:{sawmill:3,statue:2,waterplateau:1},
  cliffhouse:{cliffhouse:1,mason:3,statue:3,temple:2},hermitage:{statue:10,temple:8,shaman:5},
  terrace:{house:2,mansion:3,citycenter:4,statue:2,terrace:2},pyre:{citycenter:5,pyre:5,statue:3},
  guildhall:{statue:5,citycenter:4,mason:3},mountainshrine:{statue:5,mason:4,shaman:3,temple:3},
  lighthouse:{fisher:5,harbor:5,statue:4},harbor:{fisher:4,warehouse:5,citycenter:3,statue:3,dock:3},
  dock:{harbor:4,fisher:3,statue:2},
  fortuneteller:{statue:5,citycenter:4},
};

var PEN = {
  mason:{shaman:-5},circus:{temple:-25,mansion:-5},fishkite:{temple:-25},
  hut:{sawmill:-1,lumberjack:-1,warehouse:-1,brickyard:-1,mill:-1,mason:-1},
  house:{wall:-2,jewelry:-2},mansion:{circus:-3,wall:-3},
  temple:{market:-20,sawmill:-20,brickyard:-20,mill:-20,goldmine:-20,tavern:-20,circus:-20,warehouse:-20},
  monument:{hopfield:-7,field:-5},park:{sawmill:-5,mill:-4,lumberjack:-4,brickyard:-3,wall:-2,warehouse:-2},
  shaman:{citycenter:-10,mason:-6},citycenter:{resortoasis:-15,shaman:-5},
  goldmine:{resortoasis:-10},warehouse:{resortoasis:-5},fisher:{seaweedfarm:-4},
  jewelry:{house:-4,wall:-3},
  resortoasis:{mason:-10,warehouse:-10,citycenter:-10,sawmill:-10,goldmine:-10,mansion:-7,brickyard:-5,seaweedfield:-5,lumberjack:-5,house:-5,mill:-3},
  cliffhouse:{mason:-4},hermitage:{citycenter:-15,market:-10,warehouse:-10},
};

var BOONS = [
  { id:"score_mult",n:"Score x1.6",desc:"Multiplies score by 1.6",i:"\u26A1",type:"mult",val:1.6,color:"#F59E0B" },
  { id:"neighborly",n:"Neighborly",desc:"Removes self-penalty",i:"\u{1F91D}",type:"no_self",val:0,color:"#22C55E" },
  { id:"sustainable",n:"Sustainable",desc:"Blocks industry penalties",i:"\u267B\uFE0F",type:"no_ind",val:0,color:"#10B981" },
  { id:"increase_area",n:"+50% Area",desc:"Grows radius by 50%",i:"\u{1F50D}",type:"rad",val:1.5,color:"#3B82F6" },
  { id:"precious",n:"Precious",desc:"+1 from all nearby, -15 flat",i:"\u2728",type:"precious",val:0,color:"#A855F7" },
  { id:"add_statue",n:"Add Statue",desc:"Grants 1 free Statue",i:"\u{1F5FF}",type:"add",val:"statue",color:"#A855F7" },
  { id:"add_terrace",n:"Add Terrace",desc:"Grants 1 Terrace",i:"\u{1FA9C}",type:"add",val:"terrace",color:"#F59E0B" },
  { id:"add_wallplat",n:"Add Wall Plat.",desc:"Grants 1 Wall Platform",i:"\u{1FAA8}",type:"add",val:"wallplateau",color:"#8B95A5" },
  { id:"demolish",n:"Demolish",desc:"Remove building, keep 60%",i:"\u{1F4A5}",type:"info",val:0,color:"#EF4444" },
  { id:"duplicate",n:"Duplicate",desc:"Copy rightmost building",i:"\u{1F4CB}",type:"info",val:0,color:"#3B82F6" },
  { id:"level_up",n:"Level Up",desc:"Points to unlock next pack",i:"\u2B06\uFE0F",type:"info",val:0,color:"#22C55E" },
  { id:"blossom",n:"Blossom",desc:"Trees become flowers (+2 ea)",i:"\u{1F338}",type:"info",val:0,color:"#EC4899" },
  { id:"verdure",n:"Add Verdure",desc:"Place trees/flowers/fish",i:"\u{1F33F}",type:"info",val:0,color:"#10B981" },
];

var PACKS = [
  {n:"Lumber",tier:"early",blds:["lumberjack","lumberjack","sawmill"],th:20},
  {n:"Farming",tier:"early",blds:["field","field","mill"],th:30},
  {n:"Seaweed",tier:"early",blds:["seaweedfield","seaweedfield","seaweedfarm"],th:45},
  {n:"Brewing",tier:"early",blds:["lumberjack","hopfield","sawmill","brewery"],th:65},
  {n:"City",tier:"mid",blds:["mansion","mansion","house","house","citycenter"],th:90},
  {n:"Shaman",tier:"mid",blds:["shaman","citycenter","mansion","house","house"],th:120},
  {n:"Brickyard",tier:"mid",blds:["brickyard","brickyard","sandpit"],th:155},
  {n:"Mason",tier:"mid",blds:["mason","mason","brickyard"],th:195},
  {n:"Fisher",tier:"mid",blds:["waterplateau","hopfield","fisher","fisher"],th:240},
  {n:"Fountain",tier:"mid",blds:["shaman","mansion","house","house","fountain"],th:290},
  {n:"Statue",tier:"late",blds:["statue","statue"],th:345},
  {n:"Temple",tier:"late",blds:["temple"],th:405},
  {n:"Warehouse",tier:"late",blds:["warehouse","warehouse","brickyard"],th:470},
  {n:"Market",tier:"late",blds:["market","warehouse"],th:540},
  {n:"Wall",tier:"late",blds:["wall","wall","wall","wall"],th:615},
  {n:"Tower",tier:"late",blds:["tower","wall","wall"],th:695},
];

var IND_TYPES = { lumberjack:1,sawmill:1,brickyard:1,sandpit:1,mason:1,goldmine:1,warehouse:1,mill:1,seaweedfarm:1 };
var TC = { early:"#22C55E", mid:"#3B82F6", late:"#A855F7" };
var FN = "'JetBrains Mono', monospace";
var U = 20; // base pixel unit

function gd(a, b) { return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y)); }
function gb(id) { if (!id) return null; for (var i=0;i<BOONS.length;i++) if (BOONS[i].id===id) return BOONS[i]; return null; }
function gr(nd) { var d=BD[nd.type]; if(!d) return 50; var bn=gb(nd.boon); return d.r*(bn&&bn.type==="rad"?bn.val:1); }
function gpx(d) { return { pw: d.w * U, ph: d.h * U }; }

/* ═══ SCORE ENGINE ═══ */
// Placement order matters: a building only scores from buildings placed BEFORE it
function calcScores(nodes) {
  var R = {};
  for (var ni=0; ni<nodes.length; ni++) {
    var nd=nodes[ni], def=BD[nd.type];
    if (!def) continue;
    var boon=gb(nd.boon), effR=gr(nd);
    var unit=def.b, bd=[{src:"Base",val:def.b}];
    // Only check buildings placed before this one (lower index = placed earlier)
    for (var oi=0; oi<ni; oi++) {
      var o=nodes[oi]; 
      var od=BD[o.type]; if(!od) continue;
      var maxR=Math.max(effR, gr(o));
      if (gd(nd,o) > maxR) continue;
      if (o.type===nd.type) {
        if (def.s!==0 && !(boon&&boon.type==="no_self")) {
          unit+=def.s; bd.push({src:def.n+" (self)",val:def.s});
        }
      } else {
        var av=(ADJ[nd.type]&&ADJ[nd.type][o.type])||0;
        if (av) { unit+=av; bd.push({src:od.n,val:av}); }
        var pv=(PEN[nd.type]&&PEN[nd.type][o.type])||0;
        if (pv && boon && boon.type==="no_ind" && IND_TYPES[o.type]) pv=0;
        if (pv) { unit+=pv; bd.push({src:od.n,val:pv}); }
        if (boon && boon.type==="precious" && !av && !pv) {
          unit+=1; bd.push({src:"+"+od.n,val:1});
        }
      }
    }
    if (boon&&boon.type==="precious") { unit-=15; bd.push({src:"Precious cost",val:-15}); }
    var mult=1;
    if (boon&&boon.type==="mult") { var bonus=Math.round(unit*(boon.val-1)); mult=boon.val; bd.push({src:"Boon x"+boon.val,val:bonus}); }
    var fu=Math.round(unit*mult);
    R[nd.id]={score:fu, unit:fu, bd:bd, order:ni+1};
  }
  return R;
}

function getSuggestions(nodes) {
  if (!nodes.length) return [{t:"Start with Lumberjack + Sawmill or Field + Mill",p:"tip"}];
  var ts={}; nodes.forEach(function(n){ts[n.type]=true;});
  var tips=[];
  if(ts.brickyard&&!ts.mason) tips.push({t:"Add Mason near Brickyard +4/+5 mutual",p:"high"});
  if(ts.mason&&!ts.temple) tips.push({t:"Masons ready! Temple gets +25 per Mason",p:"high"});
  if(ts.warehouse&&!ts.market) tips.push({t:"Market gets +20 from each Warehouse",p:"high"});
  if(ts.temple&&ts.market) tips.push({t:"Temple gets -20 from Market!",p:"warn"});
  if(ts.temple&&ts.warehouse) tips.push({t:"Temple gets -20 from Warehouse!",p:"warn"});
  if(ts.temple&&!ts.statue) tips.push({t:"Temple needs Statue (+40!)",p:"high"});
  if(ts.goldmine&&!ts.jewelry) tips.push({t:"Jewelry gets +30 from Gold Mine",p:"mid"});
  if(ts.brewery&&!ts.tavern) tips.push({t:"Tavern gets +18 from Brewery",p:"mid"});
  if(ts.resortoasis&&ts.mason) tips.push({t:"Resort -10 from Mason!",p:"warn"});
  if(ts.citycenter&&!ts.fisher) tips.push({t:"Fisher + City Center = +7 mutual",p:"mid"});
  if(!tips.length) tips.push({t:"Solid layout! Consider district zoning",p:"tip"});
  return tips.slice(0,5);
}

/* ═══ COMPONENTS ═══ */
function BuildingShape(props) {
  var def=props.def, isSel=props.isSel, isHov=props.isHov, strokeColor=props.strokeColor;
  var p = gpx(def);
  return (
    <rect x={-p.pw/2} y={-p.ph/2} width={p.pw} height={p.ph} rx={2}
      fill="#0C1222" stroke={strokeColor} strokeWidth={isSel ? 2 : 1.2}
      filter={isHov ? "url(#glo)" : undefined} />
  );
}

function NodeGroup(props) {
  var nd=props.nd, def=props.def, cat=props.cat, isSel=props.isSel, isHov=props.isHov,
      sc=props.sc, order=props.order, onMD=props.onMD, onEnter=props.onEnter, onLeave=props.onLeave;
  var boon = gb(nd.boon);
  var strokeColor = isSel ? cat.color : boon ? boon.color+"88" : "#1E293B";
  var p = gpx(def);
  var halfW = p.pw / 2;

  return (
    <g data-nodeid={nd.id}
      transform={"translate("+nd.x+","+nd.y+")"}
      onMouseDown={function(e){onMD(e,nd.id);}}
      onMouseEnter={function(){onEnter(nd.id);}}
      onMouseLeave={function(){onLeave();}}
      style={{cursor:"grab"}}>

      <BuildingShape def={def} isSel={isSel} isHov={isHov} strokeColor={strokeColor} />

      {/* Category inner border */}
      <rect x={-p.pw/2 + 2} y={-p.ph/2 + 2}
        width={p.pw - 4} height={p.ph - 4} rx={1}
        fill="none" stroke={cat.color+"30"} strokeWidth={1.5} />

      {/* Icon */}
      <text x={0} y={1} textAnchor="middle" dominantBaseline="central"
        fontSize={Math.max(10, Math.min(p.pw, p.ph) * 0.65)}
        style={{pointerEvents:"none"}}>{def.i}</text>

      {/* Boon indicator */}
      {boon && (
        <g transform={"translate("+(halfW + 2)+","+(p.ph/2 - 2)+")"}>
          <circle r={6} fill={boon.color} stroke="#0C1222" strokeWidth={1.5} />
          <text x={0} y={1} textAnchor="middle" dominantBaseline="central"
            fontSize={7} style={{pointerEvents:"none"}}>{boon.i}</text>
        </g>
      )}

      {/* Placement order */}
      <text x={-halfW - 3} y={-p.ph/2 - 3} textAnchor="end" dominantBaseline="auto"
        fill="#4A5568" fontSize={6} fontFamily={FN} fontWeight={600}
        style={{pointerEvents:"none"}}>{"#"+order}</text>

      {/* Score - minimal text, no background */}
      <text x={halfW + 3} y={-p.ph/2 - 3} textAnchor="start" dominantBaseline="auto"
        fill={sc >= 0 ? "#6EE7B7" : "#FCA5A5"} fontSize={7} fontWeight={700} fontFamily={FN}
        style={{pointerEvents:"none"}}>{sc >= 0 ? "+" : ""}{sc}</text>

      {/* Name label */}
      <text x={0} y={p.ph/2 + 13} textAnchor="middle"
        fill="#4A5568" fontSize={8} fontFamily={FN} fontWeight={600}
        style={{pointerEvents:"none"}}>{def.n}</text>
    </g>
  );
}

function Tooltip(props) {
  var node=props.node, scores=props.scores, pan=props.pan, zoom=props.zoom;
  if (!node) return null;
  var def=BD[node.type]; if(!def) return null;
  var sd=scores[node.id]; if(!sd) return null;
  var cat=CATS[def.c], boon=gb(node.boon);
  return (
    <div style={{position:"absolute",left:(node.x+pan.x)*zoom+48,top:(node.y+pan.y)*zoom-30,
      background:"#0C1222EE",border:"1px solid #1A2236",borderRadius:6,padding:"9px 12px",
      minWidth:200,maxWidth:270,zIndex:100,pointerEvents:"none",fontFamily:FN}}>
      <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:5}}>
        <span style={{fontSize:20}}>{def.i}</span>
        <div style={{flex:1}}>
          <div style={{color:"#F0F4F8",fontWeight:700,fontSize:12}}>{def.n}</div>
          <div style={{color:cat.color,fontSize:8}}>{cat.label} | r{def.r} | {def.w+"x"+def.h} | {def.t}{boon?" | "+boon.n:""}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:18,fontWeight:800,color:sd.score>=0?"#34D399":"#F87171"}}>{sd.score>=0?"+":""}{sd.score}</div>
        </div>
      </div>
      <div style={{borderTop:"1px solid #1A2236",paddingTop:4,maxHeight:170,overflow:"auto"}}>
        {sd.bd.map(function(item,idx){
          return <div key={idx} style={{display:"flex",justifyContent:"space-between",fontSize:8,padding:"1px 0"}}>
            <span style={{color:"#4A5568"}}>{item.src}</span>
            <span style={{fontWeight:600,color:item.val>=0?"#6EE7B7":"#FCA5A5"}}>{item.val>=0?"+":""}{item.val}</span>
          </div>;
        })}
      </div>
    </div>
  );
}

function CountControl(props) {
  var node=props.node, pan=props.pan, zoom=props.zoom, onUpdate=props.onUpdate;
  if (!node) return null;
  var def=BD[node.type]; if(!def) return null;
  var p=gpx(def);
  return (
    <div style={{position:"absolute",left:(node.x+pan.x)*zoom-38,top:(node.y+pan.y)*zoom-p.ph/2*zoom-28,
      display:"flex",alignItems:"center",gap:3,background:"#0C1222EE",border:"1px solid #1A2236",
      borderRadius:5,padding:"3px 6px",zIndex:20,fontFamily:FN}}
      onMouseDown={function(e){e.stopPropagation();}}>
      <button onClick={function(){onUpdate(Math.max(1,cnt-1));}}
        style={{width:20,height:20,borderRadius:3,border:"none",background:"#1E293B",color:"#94A3B8",fontSize:13,cursor:"pointer",fontFamily:FN,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
      <span style={{fontSize:13,fontWeight:800,color:cnt>1?"#F59E0B":"#C8D6E5",minWidth:18,textAlign:"center"}}>{cnt}</span>
      <button onClick={function(){onUpdate(cnt+1);}}
        style={{width:20,height:20,borderRadius:3,border:"none",background:"#1E293B",color:"#94A3B8",fontSize:13,cursor:"pointer",fontFamily:FN,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
      <span style={{fontSize:7,color:"#4A5568",marginLeft:1}}>QTY</span>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function App() {
  var _s = useState, _r = useRef, _e = useEffect, _m = useMemo, _c = useCallback;
  var _nodes     = _s([]),     nodes=_nodes[0],     setNodes=_nodes[1];
  var _sel       = _s(null),   selId=_sel[0],       setSelId=_sel[1];
  var _hov       = _s(null),   hovId=_hov[0],       setHovId=_hov[1];
  var _filt      = _s(null),   filter=_filt[0],     setFilter=_filt[1];
  var _radii     = _s(true),   radiiOn=_radii[0],   setRadiiOn=_radii[1];
  var _hidR      = _s({}),     hidR=_hidR[0],       setHidR=_hidR[1];
  var _ns        = _s(true),   showNS=_ns[0],       setShowNS=_ns[1];
  var _pan       = _s({x:0,y:0}), pan=_pan[0],      setPan=_pan[1];
  var _zoom      = _s(1),      zoom=_zoom[0],       setZoom=_zoom[1];
  var _tab       = _s("buildings"), tab=_tab[0],     setTab=_tab[1];
  var _ghost     = _s(null),   ghost=_ghost[0],     setGhost=_ghost[1];
  var _mob       = _s(false),  isMobile=_mob[0],    setIsMobile=_mob[1];
  var _panel     = _s(false),  panelOpen=_panel[0], setPanelOpen=_panel[1];

  var idRef=_r(1), cvRef=_r(null), dragRef=_r(null), panRef=_r(null), touchRef=_r(null);

  var scores = _m(function(){ return calcScores(nodes); }, [nodes]);
  var total = _m(function(){ var s=0; for(var k in scores) s+=scores[k].score; return s; }, [scores]);
  var suggestions = _m(function(){ return getSuggestions(nodes); }, [nodes]);
  var selNode = _m(function(){ return nodes.find(function(n){return n.id===selId;})||null; }, [nodes,selId]);
  var tipNode = _m(function(){ return nodes.find(function(n){return n.id===hovId;})||selNode; }, [nodes,hovId,selNode]);

  function s2c(sx,sy) { return {x:sx/zoom-pan.x, y:sy/zoom-pan.y}; }

  function addAt(type,x,y) {
    var id=idRef.current++;
    setNodes(function(p){return p.concat([{id:id,type:type,x:x,y:y,boon:null}]);});
  }
  function addRandom(type) {
    var pos=s2c(350+(Math.random()-.5)*200, 300+(Math.random()-.5)*200);
    addAt(type,pos.x,pos.y);
  }

  _e(function(){
    function h(e){
      if((e.key==="Delete"||e.key==="Backspace")&&selId){setNodes(function(p){return p.filter(function(n){return n.id!==selId;});});setSelId(null);}
      if(e.key==="z"&&(e.ctrlKey||e.metaKey)&&!e.shiftKey){e.preventDefault();setNodes(function(p){if(!p.length)return p;return p.slice(0,-1);});setSelId(null);}
      if(e.key==="d"&&(e.ctrlKey||e.metaKey)&&selId){e.preventDefault();setNodes(function(p){var nd=p.find(function(n){return n.id===selId;});if(!nd)return p;var nid=idRef.current++;setTimeout(function(){setSelId(nid);},0);return p.concat([{id:nid,type:nd.type,x:nd.x+40,y:nd.y+40,boon:nd.boon}]);});}
    }
    window.addEventListener("keydown",h); return function(){window.removeEventListener("keydown",h);};
  },[selId]);

  // Mobile detection
  _e(function(){
    function check(){setIsMobile(window.innerWidth < 768);}
    check();
    window.addEventListener("resize",check);
    return function(){window.removeEventListener("resize",check);};
  },[]);

  // Touch handlers for mobile pan/drag/pinch
  _e(function(){
    var el=cvRef.current; if(!el) return;
    function onTS(e){
      if(e.touches.length===1){
        var t=e.touches[0];
        // Check if touching a node
        var target=document.elementFromPoint(t.clientX,t.clientY);
        var nodeEl=target?target.closest("[data-nodeid]"):null;
        if(nodeEl){
          var nid=parseInt(nodeEl.getAttribute("data-nodeid"));
          setSelId(nid);
          var nd=null;
          for(var i=0;i<nodes.length;i++){if(nodes[i].id===nid){nd=nodes[i];break;}}
          if(nd) dragRef.current={id:nid,ox:t.clientX/zoom-pan.x-nd.x,oy:t.clientY/zoom-pan.y-nd.y};
        } else {
          setSelId(null);
          if(isMobile&&panelOpen) setPanelOpen(false);
          panRef.current={sx:t.clientX,sy:t.clientY,px:pan.x,py:pan.y};
        }
      } else if(e.touches.length===2){
        // Pinch zoom start
        var dx=e.touches[0].clientX-e.touches[1].clientX;
        var dy=e.touches[0].clientY-e.touches[1].clientY;
        touchRef.current={dist:Math.sqrt(dx*dx+dy*dy),zoom:zoom};
      }
    }
    function onTM(e){
      e.preventDefault();
      if(e.touches.length===1){
        var t=e.touches[0];
        if(dragRef.current){
          var info=dragRef.current;
          setNodes(function(p){return p.map(function(n){return n.id===info.id?Object.assign({},n,{x:t.clientX/zoom-pan.x-info.ox,y:t.clientY/zoom-pan.y-info.oy}):n;});});
        } else if(panRef.current){
          setPan({x:panRef.current.px+(t.clientX-panRef.current.sx)/zoom,y:panRef.current.py+(t.clientY-panRef.current.sy)/zoom});
        }
      } else if(e.touches.length===2&&touchRef.current){
        var dx=e.touches[0].clientX-e.touches[1].clientX;
        var dy=e.touches[0].clientY-e.touches[1].clientY;
        var newDist=Math.sqrt(dx*dx+dy*dy);
        var scale=newDist/touchRef.current.dist;
        var nz=Math.max(.15,Math.min(3,touchRef.current.zoom*scale));
        setZoom(nz);
      }
    }
    function onTE(){dragRef.current=null;panRef.current=null;touchRef.current=null;}
    el.addEventListener("touchstart",onTS,{passive:false});
    el.addEventListener("touchmove",onTM,{passive:false});
    el.addEventListener("touchend",onTE);
    return function(){el.removeEventListener("touchstart",onTS);el.removeEventListener("touchmove",onTM);el.removeEventListener("touchend",onTE);};
  },[nodes,zoom,pan]);

  // Zoom centered on buildings centroid
  function zoomCentered(factor) {
    var newZoom = Math.max(0.15, Math.min(3, zoom * factor));
    if (nodes.length === 0) { setZoom(newZoom); return; }
    // Compute centroid of all buildings in canvas coords
    var cx = 0, cy = 0;
    for (var i = 0; i < nodes.length; i++) { cx += nodes[i].x; cy += nodes[i].y; }
    cx /= nodes.length; cy /= nodes.length;
    // Get viewport center in canvas coords at current zoom
    var rect = cvRef.current ? cvRef.current.getBoundingClientRect() : { width: 800, height: 600 };
    var vpCx = rect.width / 2;
    var vpCy = rect.height / 2;
    // New pan so centroid maps to viewport center at new zoom
    var newPanX = vpCx / newZoom - cx;
    var newPanY = vpCy / newZoom - cy;
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }

  _e(function(){
    var el=cvRef.current; if(!el) return;
    function h(e){
      e.preventDefault();
      var factor = e.deltaY > 0 ? 0.92 : 1.08;
      // If nodes exist, zoom toward centroid; otherwise just zoom
      if (nodes.length === 0) {
        setZoom(function(p){return Math.max(.15,Math.min(3,p*factor));});
        return;
      }
      var cx=0,cy=0;
      for(var i=0;i<nodes.length;i++){cx+=nodes[i].x;cy+=nodes[i].y;}
      cx/=nodes.length;cy/=nodes.length;
      var rect=el.getBoundingClientRect();
      var vpCx=rect.width/2, vpCy=rect.height/2;
      setZoom(function(oldZ){
        var nz=Math.max(.15,Math.min(3,oldZ*factor));
        setPan({x:vpCx/nz-cx, y:vpCy/nz-cy});
        return nz;
      });
    }
    el.addEventListener("wheel",h,{passive:false}); return function(){el.removeEventListener("wheel",h);};
  },[nodes]);

  function onCvDown(e) {
    if(e.target.closest("[data-nodeid]")) return;
    setSelId(null);
    if(isMobile&&panelOpen) setPanelOpen(false);
    panRef.current={sx:e.clientX,sy:e.clientY,px:pan.x,py:pan.y};
  }
  function onMove(e) {
    if(dragRef.current){var i=dragRef.current;setNodes(function(p){return p.map(function(n){return n.id===i.id?Object.assign({},n,{x:e.clientX/zoom-pan.x-i.ox,y:e.clientY/zoom-pan.y-i.oy}):n;});});}
    else if(panRef.current){setPan({x:panRef.current.px+(e.clientX-panRef.current.sx)/zoom,y:panRef.current.py+(e.clientY-panRef.current.sy)/zoom});}
    if(ghost) setGhost(Object.assign({},ghost,{x:e.clientX,y:e.clientY}));
  }
  function onUp(e) {
    if(ghost){var rect=cvRef.current?cvRef.current.getBoundingClientRect():null;if(rect&&e.clientX>=rect.left&&e.clientX<=rect.right&&e.clientY>=rect.top&&e.clientY<=rect.bottom){var pos=s2c(e.clientX-rect.left,e.clientY-rect.top);addAt(ghost.type,pos.x,pos.y);}setGhost(null);}
    dragRef.current=null; panRef.current=null;
  }
  function onNodeDown(e,nid) {
    e.stopPropagation(); setSelId(nid);
    var nd=nodes.find(function(n){return n.id===nid;});
    if(nd) dragRef.current={id:nid,ox:e.clientX/zoom-pan.x-nd.x,oy:e.clientY/zoom-pan.y-nd.y};
  }

  var lines = _m(function(){
    var res=[];
    for(var i=0;i<nodes.length;i++) for(var j=0;j<i;j++){
      // i was placed AFTER j. Show what i gets from j.
      var later=nodes[i],earlier=nodes[j],dl=BD[later.type],de=BD[earlier.type];
      if(!dl||!de) continue;
      if(gd(later,earlier) > Math.max(gr(later),gr(earlier))) continue;
      var t=0;
      if(later.type===earlier.type){t=dl.s;}
      else{t=((ADJ[later.type]&&ADJ[later.type][earlier.type])||0)+((PEN[later.type]&&PEN[later.type][earlier.type])||0);}
      if(t!==0) res.push({a:earlier,b:later,t:t});
    }
    return res;
  },[nodes]);

  var buildingEntries = Object.entries(BD).filter(function(e){return(!filter||e[1].c===filter)&&(!e[1].ns||showNS);});

  return (
    <div style={{display:"flex",flexDirection:isMobile?"column":"row",height:"100vh",width:"100vw",overflow:"hidden",fontFamily:FN,background:"#080E1A",color:"#C8D6E5",userSelect:"none",touchAction:"none"}} onMouseMove={onMove} onMouseUp={onUp}>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

      {/* SIDEBAR - full height on desktop, collapsible bottom panel on mobile */}
      {(!isMobile || panelOpen) && <div style={isMobile?{position:"absolute",bottom:0,left:0,right:0,height:"60vh",background:"#0C1222",borderTop:"2px solid #E59500",zIndex:30,display:"flex",flexDirection:"column",borderRadius:"16px 16px 0 0",boxShadow:"0 -4px 24px rgba(0,0,0,.5)"}:{width:236,background:"#0C1222",borderRight:"1px solid #1A2236",display:"flex",flexDirection:"column",height:"100%",flexShrink:0}}>
        {isMobile&&<div onClick={function(){setPanelOpen(false);}} style={{display:"flex",justifyContent:"center",padding:"10px 0 6px",cursor:"pointer"}}><div style={{width:48,height:5,borderRadius:3,background:"#4A5568"}}/></div>}
        <div style={{display:"flex",borderBottom:"1px solid #1A2236"}}>
          {["buildings","packs","boons","tips"].map(function(t){return <button key={t} onClick={function(){setTab(t);}} style={{flex:1,padding:isMobile?"14px 0":"12px 0",fontSize:isMobile?13:11,letterSpacing:1.2,textTransform:"uppercase",background:tab===t?"#1A2236":"transparent",color:tab===t?"#F0F4F8":"#4A5568",border:"none",cursor:"pointer",fontFamily:FN,fontWeight:700,borderBottom:tab===t?"2px solid #E59500":"2px solid transparent"}}>{t}</button>;})}
        </div>

        {tab==="buildings"&&<div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:isMobile?6:4,padding:isMobile?"10px 10px 6px":"8px 6px 4px"}}>
            <button onClick={function(){setFilter(null);}} style={{fontSize:isMobile?13:10,padding:isMobile?"8px 14px":"4px 8px",borderRadius:isMobile?8:4,border:"none",cursor:"pointer",background:!filter?"#2A3A52":"#141E30",color:!filter?"#F0F4F8":"#4A5568",fontFamily:FN,fontWeight:600}}>All</button>
            {Object.entries(CATS).filter(function(e){return e[0]!=="newshores"||showNS;}).map(function(e){return <button key={e[0]} onClick={function(){setFilter(e[0]);}} style={{fontSize:isMobile?13:10,padding:isMobile?"8px 14px":"4px 8px",borderRadius:isMobile?8:4,border:"none",cursor:"pointer",background:filter===e[0]?e[1].color+"33":"#141E30",color:filter===e[0]?e[1].color:"#4A5568",fontFamily:FN,fontWeight:600}}>{e[1].label}</button>;})}
          </div>
          <div onClick={function(){setShowNS(!showNS);}} style={{display:"flex",alignItems:"center",gap:8,padding:isMobile?"6px 14px":"5px 10px",fontSize:isMobile?13:10,color:showNS?"#F59E0B":"#4A5568",cursor:"pointer"}}>
            <div style={{width:isMobile?36:28,height:isMobile?22:16,borderRadius:isMobile?11:8,background:showNS?"#F59E0B":"#2A3545",position:"relative",transition:"background .2s",flexShrink:0}}>
              <div style={{width:isMobile?18:12,height:isMobile?18:12,borderRadius:isMobile?9:6,background:"#F0F4F8",position:"absolute",top:2,left:showNS?(isMobile?16:14):2,transition:"left .2s"}}/>
            </div>
            New Shores*
          </div>
          <div style={{flex:1,overflow:"auto",padding:isMobile?"2px 8px 8px":"2px 6px 6px",WebkitOverflowScrolling:"touch"}}>
            {buildingEntries.map(function(entry){var key=entry[0],b=entry[1],cat=CATS[b.c];
              return <div key={key} onMouseDown={function(e){if(e.button===0&&!isMobile)setGhost({type:key,x:e.clientX,y:e.clientY});}} onClick={function(){addRandom(key);}}
                style={{width:"100%",display:"flex",alignItems:"center",gap:isMobile?10:5,padding:isMobile?"12px 10px":"5px 6px",marginBottom:isMobile?2:1,borderRadius:isMobile?8:4,background:"transparent",cursor:"pointer",fontFamily:FN,color:"#C8D6E5",fontSize:isMobile?14:10,minHeight:isMobile?48:0}}
                onMouseEnter={function(e){if(!isMobile)e.currentTarget.style.background="#1A2236";}} onMouseLeave={function(e){e.currentTarget.style.background="transparent";}}>
                <span style={{fontSize:isMobile?22:14,width:isMobile?28:20,textAlign:"center",flexShrink:0}}>{b.i}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:isMobile?14:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{b.n}{b.ns?" *":""}</div>
                  <div style={{fontSize:isMobile?10:7,color:cat.color}}>{b.b>=0?"+":""}{b.b} | r{b.r} | {b.w+"x"+b.h}</div>
                </div>
                <div style={{fontSize:isMobile?10:7,color:"#4A5568"}}>s:{b.s>=0?"+":""}{b.s}</div>
              </div>;
            })}
          </div>
        </div>}

        {tab==="packs"&&<div style={{flex:1,overflow:"auto",padding:7}}>
          <div style={{fontSize:9,color:"#4A5568",marginBottom:6}}>SCORE: <span style={{color:"#F0F4F8",fontWeight:700}}>{total}</span></div>
          {PACKS.map(function(p,i){var u=total>=p.th;return <div key={i} style={{marginBottom:4,padding:"5px 6px",borderRadius:4,background:u?"#0F291A":"#141E30",border:"1px solid "+(u?"#22C55E33":"#1A2236"),opacity:u?1:.5}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:2}}><span style={{fontSize:9,fontWeight:700,color:u?"#6EE7B7":"#C8D6E5"}}>{u?"\u2713 ":""}{p.n} Pack</span><span style={{fontSize:7,color:TC[p.tier],background:TC[p.tier]+"22",padding:"1px 4px",borderRadius:2}}>{p.tier}|{p.th}</span></div>
            <div style={{display:"flex",gap:2}}>{p.blds.map(function(bk,j){var d=BD[bk];return <span key={j} style={{fontSize:11}} title={d?d.n:bk}>{d?d.i:"?"}</span>;})}</div>
          </div>;})}
        </div>}

        {tab==="boons"&&<div style={{flex:1,overflow:"auto",padding:7}}>
          <div style={{fontSize:8,color:"#4A5568",marginBottom:6,lineHeight:1.5}}>{selNode?"Applying to: "+BD[selNode.type].n:"Select a node, then click a boon"}</div>
          {BOONS.map(function(boon){var isOn=selNode&&selNode.boon===boon.id,isAdd=boon.type==="add",can=selNode||isAdd;
            return <button key={boon.id} onClick={function(){if(isAdd&&typeof boon.val==="string"){addRandom(boon.val);}else if(selNode){setNodes(function(p){return p.map(function(n){return n.id===selId?Object.assign({},n,{boon:isOn?null:boon.id}):n;});});}}}
              style={{width:"100%",display:"flex",alignItems:"center",gap:6,padding:"6px 7px",marginBottom:3,borderRadius:4,border:"1px solid "+(isOn?boon.color+"66":"#1A2236"),background:isOn?boon.color+"18":"#141E30",cursor:can?"pointer":"default",textAlign:"left",fontFamily:FN,opacity:can?1:.35}}>
              <span style={{fontSize:16,width:22,textAlign:"center",flexShrink:0}}>{boon.i}</span>
              <div style={{flex:1}}><div style={{fontSize:10,fontWeight:600,color:isOn?boon.color:"#C8D6E5"}}>{boon.n}</div><div style={{fontSize:7,color:"#4A5568",lineHeight:1.4}}>{boon.desc}</div></div>
              {isOn&&<span style={{fontSize:8,color:boon.color}}>ON</span>}{isAdd&&<span style={{fontSize:7,color:"#4A5568"}}>+1</span>}
            </button>;
          })}
        </div>}

        {tab==="tips"&&<div style={{flex:1,overflow:"auto",padding:7}}>
          {suggestions.map(function(s,i){return <div key={i} style={{marginBottom:4,padding:6,borderRadius:4,fontSize:9,lineHeight:1.5,background:s.p==="warn"?"#7F1D1D18":s.p==="high"?"#05291618":"#141E30",border:"1px solid "+(s.p==="warn"?"#EF444433":s.p==="high"?"#22C55E33":"#1A2236"),color:s.p==="warn"?"#FCA5A5":s.p==="high"?"#6EE7B7":"#C8D6E5"}}>{s.t}</div>;})}
          <div style={{marginTop:8,padding:6,background:"#141E30",borderRadius:4,border:"1px solid #1A2236"}}>
            <div style={{fontSize:8,color:"#E59500",fontWeight:700,marginBottom:3}}>DISTRICT STRATEGY</div>
            <div style={{fontSize:8,color:"#4A5568",lineHeight:1.6}}>Industry (Brickyard-Mason-Warehouse), Farm (Fields-Mill-Brewery), City (Houses-Fountain), Temple district (Mason+Walls+Statues far from industry).</div>
          </div>
        </div>}
      </div>}

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",position:"relative",minHeight:0}}>
        {/* Toolbar */}
        <div style={{display:"flex",alignItems:"center",gap:isMobile?6:8,padding:isMobile?"8px 10px":"6px 12px",background:"#0C1222",borderBottom:"1px solid #1A2236",zIndex:10,flexShrink:0}}>
          {isMobile&&<button onClick={function(){setPanelOpen(!panelOpen);}} style={{width:44,height:44,borderRadius:8,border:"1px solid #E59500",background:panelOpen?"#E5950033":"transparent",color:"#E59500",fontSize:18,cursor:"pointer",fontFamily:FN,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {panelOpen?"\u2715":"\u2630"}
          </button>}
          {!isMobile&&<div style={{fontSize:12,fontWeight:800,letterSpacing:2,color:"#F0F4F8"}}>ISLANDERS<span style={{color:"#E59500"}}>{"\u2B21"}</span>PLANNER</div>}
          {!isMobile&&<div style={{width:1,height:16,background:"#1A2236"}}/>}
          <div style={{fontSize:isMobile?20:18,fontWeight:800,color:total>=0?"#34D399":"#F87171"}}>{total>=0?"+":""}{total}</div>
          <div style={{fontSize:isMobile?11:9,color:"#4A5568"}}>{nodes.length}</div>
          <div style={{flex:1}}/>
          {!isMobile&&<div onClick={function(){setRadiiOn(!radiiOn);}} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"3px 7px",borderRadius:4,background:"#141E30"}}>
            <span style={{fontSize:9,color:radiiOn?"#F0F4F8":"#4A5568",fontFamily:FN}}>RADII</span>
            <div style={{width:32,height:18,borderRadius:9,background:radiiOn?"#22C55E":"#2A3545",position:"relative",transition:"background .2s"}}>
              <div style={{width:14,height:14,borderRadius:7,background:"#F0F4F8",position:"absolute",top:2,left:radiiOn?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
            </div>
          </div>}
          {!isMobile&&selNode&&<div onClick={function(){setHidR(function(p){var n=Object.assign({},p);n[selId]=!n[selId];return n;});}} style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",padding:"3px 7px",borderRadius:4,background:"#141E30"}}>
            <span style={{fontSize:9,color:!hidR[selId]?"#F0F4F8":"#4A5568",fontFamily:FN}}>THIS</span>
            <div style={{width:32,height:18,borderRadius:9,background:!hidR[selId]?"#3B82F6":"#2A3545",position:"relative",transition:"background .2s"}}>
              <div style={{width:14,height:14,borderRadius:7,background:"#F0F4F8",position:"absolute",top:2,left:!hidR[selId]?16:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.3)"}}/>
            </div>
          </div>}
          {nodes.length>0&&<button onClick={function(){setNodes(function(p){if(!p.length)return p;var last=p[p.length-1];if(selId===last.id)setSelId(null);return p.slice(0,-1);});}} style={{padding:isMobile?"10px 14px":"3px 7px",borderRadius:isMobile?8:3,border:"1px solid #E5950044",background:"#E5950011",color:"#E59500",fontSize:isMobile?13:9,cursor:"pointer",fontFamily:FN,minHeight:isMobile?44:0}}>UNDO</button>}
          {!isMobile&&<button onClick={function(){setNodes([]);setSelId(null);setPan({x:0,y:0});setZoom(1);setHidR({});}} style={{padding:"3px 7px",borderRadius:3,border:"1px solid #1A2236",background:"transparent",color:"#4A5568",fontSize:9,cursor:"pointer",fontFamily:FN}}>CLEAR</button>}
          <div style={{display:"flex",alignItems:"center",gap:isMobile?4:2}}>
            <button onClick={function(){zoomCentered(0.8);}} style={{width:isMobile?40:22,height:isMobile?40:22,borderRadius:isMobile?8:3,border:"1px solid #1A2236",background:"#141E30",color:"#94A3B8",fontSize:isMobile?18:13,cursor:"pointer",fontFamily:FN,display:"flex",alignItems:"center",justifyContent:"center"}}>-</button>
            <span style={{fontSize:isMobile?11:8,color:"#4A5568",minWidth:isMobile?40:32,textAlign:"center",fontFamily:FN}}>{Math.round(zoom*100)}%</span>
            <button onClick={function(){zoomCentered(1.25);}} style={{width:isMobile?40:22,height:isMobile?40:22,borderRadius:isMobile?8:3,border:"1px solid #1A2236",background:"#141E30",color:"#94A3B8",fontSize:isMobile?18:13,cursor:"pointer",fontFamily:FN,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          </div>
        </div>

        <div ref={cvRef} style={{flex:1,position:"relative",overflow:"hidden"}} onMouseDown={onCvDown}>
          <svg style={{width:"100%",height:"100%"}}>
            <defs>
              <pattern id="grd" width={50} height={50} patternUnits="userSpaceOnUse" patternTransform={"translate("+(pan.x*zoom)+","+(pan.y*zoom)+") scale("+zoom+")"}>
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#111B2E" strokeWidth="0.5"/>
              </pattern>
              <filter id="glo"><feGaussianBlur stdDeviation="3" result="bl"/><feMerge><feMergeNode in="bl"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            </defs>
            <rect width="100%" height="100%" fill="#080E1A"/>
            <rect width="100%" height="100%" fill="url(#grd)"/>

            <g transform={"scale("+zoom+") translate("+pan.x+","+pan.y+")"}>
              {/* Radii - when global ON show all (hidR overrides individual) */}
              {nodes.map(function(nd){
                if (!radiiOn && !hidR[nd.id]) return null;
                if (radiiOn && hidR[nd.id]) return null;
                var def=BD[nd.type]; if(!def) return null;
                var cat=CATS[def.c], effR=gr(nd), active=selId===nd.id||hovId===nd.id;
                return <circle key={"r-"+nd.id} cx={nd.x} cy={nd.y} r={effR}
                  fill={cat.color+(active?"18":"08")} stroke={cat.color+(active?"60":"28")}
                  strokeWidth={active?1.5:1} strokeDasharray={active?"none":"6 3"}/>;
              })}

              {/* Lines */}
              {lines.map(function(l,i){return <g key={"l-"+i}>
                <line x1={l.a.x} y1={l.a.y} x2={l.b.x} y2={l.b.y} stroke={l.t>0?"#22C55E44":"#EF444444"} strokeWidth={Math.min(Math.abs(l.t)/5+.5,4)} strokeDasharray={l.t>0?"none":"5 3"}/>
                <text x={(l.a.x+l.b.x)/2} y={(l.a.y+l.b.y)/2-5} fill={l.t>0?"#6EE7B7":"#FCA5A5"} fontSize={8} textAnchor="middle" fontFamily={FN} fontWeight={700}>{l.t>=0?"+":""}{l.t}</text>
              </g>;})}

              {/* Nodes */}
              {nodes.map(function(nd,idx){
                var def=BD[nd.type]; if(!def) return null;
                var cat=CATS[def.c], sc=scores[nd.id]?scores[nd.id].score:0;
                return <NodeGroup key={nd.id} nd={nd} def={def} cat={cat}
                  isSel={selId===nd.id} isHov={hovId===nd.id} sc={sc} order={idx+1}
                  onMD={onNodeDown} onEnter={setHovId} onLeave={function(){setHovId(null);}}/>;
              })}
            </g>
          </svg>

          <Tooltip node={tipNode} scores={scores} pan={pan} zoom={zoom}/>

          {ghost&&BD[ghost.type]&&<div style={{position:"fixed",left:ghost.x-16,top:ghost.y-16,fontSize:28,pointerEvents:"none",zIndex:1000,opacity:.8}}>{BD[ghost.type].i}</div>}

          {nodes.length===0&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",textAlign:"center",pointerEvents:"none",padding:isMobile?20:0}}>
            <div style={{fontSize:isMobile?64:48,marginBottom:isMobile?12:8,opacity:.15}}>{"\u2B21"}</div>
            <div style={{fontSize:isMobile?16:12,fontWeight:700,letterSpacing:isMobile?2:3,color:"#2A3A52",marginBottom:isMobile?8:5}}>{isMobile?"TAP + TO ADD BUILDINGS":"DRAG OR CLICK TO START"}</div>
            <div style={{fontSize:isMobile?11:8,letterSpacing:1,color:"#1A2236",lineHeight:1.6}}>{isMobile?"PINCH TO ZOOM \u00B7 DRAG TO PAN \u00B7 TAP NODE TO SELECT":"DRAG FROM SIDEBAR | SCROLL ZOOM | CTRL+Z UNDO"}</div>
          </div>}
        </div>

        {/* Mobile FAB - bottom left + button to open building panel */}
        {isMobile&&!panelOpen&&<button onClick={function(){setPanelOpen(true);setTab("buildings");}} style={{position:"absolute",bottom:20,left:20,width:56,height:56,borderRadius:16,border:"none",background:"#E59500",color:"#0C1222",fontSize:28,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(229,149,0,.4)",zIndex:20}}>+</button>}

        {nodes.length>0&&!isMobile&&<div style={{display:"flex",gap:4,padding:"4px 12px",background:"#0C1222",borderTop:"1px solid #1A2236",overflow:"auto",fontSize:8,flexShrink:0}}>
          {Object.entries(CATS).map(function(e){var k=e[0],c=e[1],cn=nodes.filter(function(n){return BD[n.type]&&BD[n.type].c===k;});if(!cn.length)return null;var cs=cn.reduce(function(a,n){return a+(scores[n.id]?scores[n.id].score:0);},0);
            return <div key={k} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 8px",borderRadius:4,background:c.color+"0A",whiteSpace:"nowrap"}}>
              <span style={{color:c.color,fontWeight:600,fontSize:10}}>{c.label}</span><span style={{color:"#4A5568",fontSize:9}}>x{cn.length}</span>
              <span style={{fontWeight:700,color:cs>=0?"#6EE7B7":"#FCA5A5",fontSize:10}}>{cs>=0?"+":""}{cs}</span>
            </div>;
          })}
        </div>}
      </div>
    </div>
  );
}
