function mapDifficultyFrToApi(d) {
  const map = { facile: "easy", moyen: "medium", difficile: "hard" };
  return map[d?.toLowerCase()] || null;
}
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function decodeHTMLEntities(str) {
  if (!str) return str;
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&eacute;/g, "é")
    .replace(/&egrave;/g, "è")
    .replace(/&uuml;/g, "ü")
    .replace(/&rsquo;/g, "’")
    .replace(/&ldquo;/g, "“")
    .replace(/&rdquo;/g, "”")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchFromOpenTDB({ amount, difficulty, type = "multiple" }) {
  const q = new URLSearchParams();
  if (amount) q.set("amount", String(amount));
  if (difficulty) q.set("difficulty", difficulty);
  if (type) q.set("type", type);
  const url = `https://opentdb.com/api.php?${q.toString()}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OpenTDB HTTP ${r.status}`);
  const json = await r.json();
  return json;
}

export const getQuiz = async (req, res) => {
  try {
    const difficultyFr = (req.query.difficulty || "facile").toLowerCase();
    let amount = parseInt(req.query.amount || "10", 10);
    if (isNaN(amount) || amount <= 0) amount = 10;

    let apiDifficulty = mapDifficultyFrToApi(difficultyFr);
    // tentative 1: demander amount avec difficulty
    let json;
    try {
      json = await fetchFromOpenTDB({ amount, difficulty: apiDifficulty, type: "multiple" });
    } catch (e) {
      // log et on essaye d'autres stratégies
      console.error("OpenTDB primary fetch error:", e.message || e);
    }

    // si pas assez de questions (response_code === 2) ou pas de json
    if (!json || json.response_code === 2) {
      // retry 1: réduire le amount (half)
      try {
        json = await fetchFromOpenTDB({ amount: Math.max(3, Math.floor(amount / 2)), difficulty: apiDifficulty, type: "multiple" });
      } catch (e) { console.warn("Retry1 failed:", e.message || e); }
    }
    if (!json || json.response_code === 2) {
      // retry 2: retirer difficulty (any difficulty)
      try {
        json = await fetchFromOpenTDB({ amount, difficulty: null, type: "multiple" });
      } catch (e) { console.warn("Retry2 failed:", e.message || e); }
    }
    if (!json || json.response_code === 2) {
      // retry 3: demander sans type (allow any)
      try {
        json = await fetchFromOpenTDB({ amount, difficulty: null, type: null });
      } catch (e) { console.warn("Retry3 failed:", e.message || e); }
    }

    // Si toujours pas de données valides -> renvoyer fallback local
    if (!json || json.response_code !== 0 || !Array.isArray(json.results) || json.results.length === 0) {
      console.error("OpenTDB returned no usable questions, sending fallback local data.");
      return res.sendStatus(200);
    }

    // normaliser les questions
    const questions = json.results.map((q, idx) => {
      const questionText = decodeHTMLEntities(q.question);
      const correct = decodeHTMLEntities(q.correct_answer);
      const incorrects = q.incorrect_answers.map(a => decodeHTMLEntities(a));
      const opts = [...incorrects, correct];
      shuffleArray(opts);
      const correctIndex = opts.findIndex(o => o === correct);
      return {
        id: idx + 1,
        question: questionText,
        options: opts,
        correctAnswer: correctIndex,
        explanation: `La bonne réponse est ${opts[correctIndex]}.`
      };
    });

    const difficultyNameFr = difficultyFr.charAt(0).toUpperCase() + difficultyFr.slice(1);
    return res.status(200).json({ name: difficultyNameFr, questions });
  } catch (err) {
    console.error("Unexpected /api/quiz error:", err);
    // renvoyer fallback au lieu de 500 pour éviter crash côté front
    return res.json(LOCAL_FALLBACK);
  }
};