export function roundWinner(firstHp: number, secondHp: number): 0 | 1 | -1 | null {
  if (firstHp > 0 && secondHp > 0) return null;
  if (firstHp <= 0 && secondHp <= 0) return -1;
  return firstHp <= 0 ? 1 : 0;
}

export function matchWon(roundsWon: number, roundsToWin: number) {
  return roundsWon >= roundsToWin;
}