const scores: { [userID: string]: number } = {};

const SCORES_FILE_PATH = "./data/scores.json";

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
}
