const SCORES_FILE_PATH = "./data/scores.json";


export const REACTION_SCORES: { [reaction: string]: number | undefined } = {
  "1️⃣": 1,
  "2️⃣": 2,
  "3️⃣": 3,
  "4️⃣": 4,
  "5️⃣": 5,
  "6️⃣": 6,
  "7️⃣": 7,
  "8️⃣": 8,
  "9️⃣": 9,
  "🔟": 10,
  "0️⃣": -10,
  "💯": 10,
  "🏆": 10,
  "🙏": 5,
  "👍": 1,
  "👎": -1,
  "⬆️": 1,
  "⬇️": -1,
  "👏": 1,
  "🍆": -3,
  "💩": -5,
  "🤡": -10,
};

const scores: { [userID: string]: number } = {};

// hydrate scores from file
try {
  const savedScores = JSON.parse(Deno.readTextFileSync(SCORES_FILE_PATH));
  Object.assign(scores, savedScores);
} catch {}

export const getScores = () => ({ ...scores });
export const getScore = (userID: string) => scores[userID] ?? 0;
export const setScore = (userID: string, score: number) => {
  scores[userID] = score;
  Deno.writeTextFile(SCORES_FILE_PATH, JSON.stringify(scores, null, 2));
};
export const addScore = (userID: string, amt: number) => {
  const score = getScore(userID);
  setScore(userID, score + amt);
}