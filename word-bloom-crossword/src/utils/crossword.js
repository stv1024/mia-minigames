export function keyOf(row, col) {
  return `${row},${col}`;
}

export function buildPuzzle(words) {
  const board = new Map();
  const placements = [];

  function canPlace(word, row, col, direction) {
    let crossings = 0;
    for (let index = 0; index < word.length; index += 1) {
      const r = row + (direction === "down" ? index : 0);
      const c = col + (direction === "across" ? index : 0);
      const existing = board.get(keyOf(r, c));
      if (existing && existing.letter !== word[index]) return null;
      if (existing && existing.letter === word[index]) crossings += 1;
    }
    return { crossings };
  }

  function commit(word, row, col, direction) {
    const cells = [];
    for (let index = 0; index < word.length; index += 1) {
      const r = row + (direction === "down" ? index : 0);
      const c = col + (direction === "across" ? index : 0);
      const key = keyOf(r, c);
      if (!board.has(key)) board.set(key, { row: r, col: c, letter: word[index] });
      cells.push(key);
    }
    placements.push({ id: placements.length + 1, word, row, col, direction, cells });
  }

  words.forEach((word, wordIndex) => {
    if (wordIndex === 0) {
      commit(word, 0, 0, "across");
      return;
    }

    const candidates = [];
    for (const existing of board.values()) {
      [...word].forEach((letter, letterIndex) => {
        if (letter !== existing.letter) return;
        ["across", "down"].forEach((direction) => {
          const row = existing.row - (direction === "down" ? letterIndex : 0);
          const col = existing.col - (direction === "across" ? letterIndex : 0);
          const result = canPlace(word, row, col, direction);
          if (!result || result.crossings === 0) return;
          const rows = direction === "down" ? word.length : 1;
          const cols = direction === "across" ? word.length : 1;
          candidates.push({
            row,
            col,
            direction,
            score: result.crossings * 50 - Math.abs(row) - Math.abs(col) - rows - cols,
          });
        });
      });
    }

    candidates.sort((a, b) => b.score - a.score || a.row - b.row || a.col - b.col);
    if (candidates.length > 0) {
      const best = candidates[0];
      commit(word, best.row, best.col, best.direction);
      return;
    }

    const maxRow = Math.max(...[...board.values()].map((cell) => cell.row));
    commit(word, maxRow + 2, 0, "across");
  });

  const activeCells = [...board.values()];
  const minRow = Math.min(...activeCells.map((cell) => cell.row));
  const minCol = Math.min(...activeCells.map((cell) => cell.col));

  activeCells.forEach((cell) => {
    cell.row -= minRow;
    cell.col -= minCol;
  });

  placements.forEach((placement) => {
    placement.row -= minRow;
    placement.col -= minCol;
    placement.cells = placement.cells.map((key) => {
      const [row, col] = key.split(",").map(Number);
      return keyOf(row - minRow, col - minCol);
    });
  });

  const normalizedBoard = new Map(activeCells.map((cell) => [keyOf(cell.row, cell.col), cell]));
  const maxRow = Math.max(...activeCells.map((cell) => cell.row));
  const maxCol = Math.max(...activeCells.map((cell) => cell.col));
  const numberByCell = new Map();
  let nextNumber = 1;

  placements.forEach((placement) => {
    const startKey = keyOf(placement.row, placement.col);
    if (!numberByCell.has(startKey)) numberByCell.set(startKey, nextNumber);
    placement.number = numberByCell.get(startKey);
    nextNumber = Math.max(nextNumber, placement.number + 1);
  });

  const cells = [];
  for (let row = 0; row <= maxRow; row += 1) {
    for (let col = 0; col <= maxCol; col += 1) {
      const active = normalizedBoard.get(keyOf(row, col));
      cells.push({
        key: keyOf(row, col),
        row,
        col,
        active: Boolean(active),
        letter: active?.letter || "",
        number: numberByCell.get(keyOf(row, col)) || "",
      });
    }
  }

  return {
    rows: maxRow + 1,
    cols: maxCol + 1,
    cells,
    placements,
  };
}
