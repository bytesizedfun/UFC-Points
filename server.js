const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static("public"));

const picksFile = path.join(__dirname, "data", "picks.json");
const fightsFile = path.join(__dirname, "data", "fights.json");

function load(f) {
  return JSON.parse(fs.readFileSync(f));
}
function save(f, d) {
  fs.writeFileSync(f, JSON.stringify(d, null, 2));
}

app.get("/api/fights", (req, res) => {
  res.json(load(fightsFile));
});

app.post("/api/submit", (req, res) => {
  const { username, picks } = req.body;
  const p = load(picksFile);
  p[username] = picks;
  save(picksFile, p);
  res.json({ success: true });
});

app.get("/api/leaderboard", (req, res) => {
  const p = load(picksFile);
  const f = load(fightsFile);
  const results = f.results || [];
  const undMap = {};
  f.fights.forEach(x => (undMap[x.id] = x.underdog));

  const wk = [], all = [];
  for (const u in p) {
    let tw = 0, tt = 0;
    p[u].forEach(pk => {
      const r = results.find(rr => rr.fightId == pk.fightId);
      if (!r) return;
      let pts = 0;
      if (pk.fighter === r.winner) {
        pts += 1;
        if (pk.method === r.method) pts += 1;
        if (undMap[pk.fightId] === pk.fighter) pts += 2;
      }
      tt += pts;
      if (r.event === f.event) tw += pts;
    });
    wk.push({ user: u, weekly: tw });
    all.push({ user: u, total: tt });
  }
  wk.sort((a, b) => b.weekly - a.weekly);
  all.sort((a, b) => b.total - a.total);
  res.json({ weekly: wk, allTime: all });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
