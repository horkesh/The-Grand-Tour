import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from './Toast';
import { writeDoc, listenDoc } from '../services/firestoreSync';

// === Constants ===

const GRID_SIZE = 8;

const TILE_COLORS = [
  '#C94C2F', // terracotta / rust
  '#194f4c', // teal
  '#8B6914', // olive gold
  '#6B3A5D', // wine
  '#2E7D8C', // mediterranean blue
  '#B85C38', // sienna
  '#4A7C59', // tuscan green
];

const ITALIAN_CHEERS = [
  'Bravo!',
  'Magnifico!',
  'Bellissimo!',
  'Perfetto!',
  'Fantastico!',
  'Eccellente!',
  'Meraviglioso!',
  'Stupendo!',
];

const REVEAL_UNLOCK_THRESHOLD = 200;
const TOTAL_REVEAL_TILES = 30;

// Phrases shown as rewards after each game
const REWARD_PHRASES = [
  { italian: 'Che bello!', english: 'How beautiful!', pronunciation: 'keh BEL-loh' },
  { italian: 'La dolce vita', english: 'The sweet life', pronunciation: 'lah DOL-cheh VEE-tah' },
  { italian: 'Andiamo!', english: "Let's go!", pronunciation: 'ahn-dee-AH-moh' },
  { italian: 'Cin cin!', english: 'Cheers!', pronunciation: 'chin chin' },
  { italian: 'Amore mio', english: 'My love', pronunciation: 'ah-MOH-reh MEE-oh' },
  { italian: 'Grazie mille', english: 'Thank you very much', pronunciation: 'GRAH-tsee-eh MEEL-leh' },
  { italian: 'Per sempre', english: 'Forever', pronunciation: 'pehr SEHM-preh' },
  { italian: 'Buon anniversario', english: 'Happy anniversary', pronunciation: 'bwon ahn-nee-vehr-SAH-ree-oh' },
  { italian: 'Ti amo', english: 'I love you', pronunciation: 'tee AH-moh' },
  { italian: 'Buongiorno', english: 'Good morning', pronunciation: 'bwon-JOHR-noh' },
  { italian: 'Buonasera', english: 'Good evening', pronunciation: 'bwoh-nah-SEH-rah' },
  { italian: 'Vorrei un tavolo per due', english: "I'd like a table for two", pronunciation: 'vohr-RAY oon TAH-voh-loh pehr DOO-eh' },
];

// Piece definitions: each is a 2D boolean grid
const PIECE_DEFS: boolean[][][] = [
  // Single
  [[true]],
  // 1x2
  [[true, true]],
  // 2x1
  [[true], [true]],
  // 1x3
  [[true, true, true]],
  // 3x1
  [[true], [true], [true]],
  // 1x4
  [[true, true, true, true]],
  // 4x1
  [[true], [true], [true], [true]],
  // 1x5
  [[true, true, true, true, true]],
  // 5x1
  [[true], [true], [true], [true], [true]],
  // 2x2
  [[true, true], [true, true]],
  // 3x3
  [[true, true, true], [true, true, true], [true, true, true]],
  // L-shapes
  [[true, false], [true, false], [true, true]],
  [[true, true], [true, false], [true, false]],
  [[true, true], [false, true], [false, true]],
  [[false, true], [false, true], [true, true]],
  // Small L
  [[true, false], [true, true]],
  [[false, true], [true, true]],
  [[true, true], [true, false]],
  [[true, true], [false, true]],
  // T-shapes
  [[true, true, true], [false, true, false]],
  [[false, true, false], [true, true, true]],
  [[true, false], [true, true], [true, false]],
  [[false, true], [true, true], [false, true]],
  // S/Z
  [[true, false], [true, true], [false, true]],
  [[false, true], [true, true], [true, false]],
  // 2x3 block
  [[true, true], [true, true], [true, true]],
  // 3x2 block
  [[true, true, true], [true, true, true]],
];

// === Seeded RNG ===

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function dateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// === Types ===

interface Piece {
  shape: boolean[][];
  color: string;
  id: number;
}

type Cell = string | null; // color string or null
type Grid = Cell[][];

// === Helpers ===

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function canPlace(grid: Grid, piece: Piece, row: number, col: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const gr = row + r;
      const gc = col + c;
      if (gr < 0 || gr >= GRID_SIZE || gc < 0 || gc >= GRID_SIZE) return false;
      if (grid[gr][gc] !== null) return false;
    }
  }
  return true;
}

function placePiece(grid: Grid, piece: Piece, row: number, col: number): Grid {
  const newGrid = grid.map((r) => [...r]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        newGrid[row + r][col + c] = piece.color;
      }
    }
  }
  return newGrid;
}

function findFullLines(grid: Grid): { rows: number[]; cols: number[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every((c) => c !== null)) rows.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    if (grid.every((row) => row[c] !== null)) cols.push(c);
  }
  return { rows, cols };
}

function clearLines(grid: Grid, rows: number[], cols: number[]): Grid {
  const newGrid = grid.map((r) => [...r]);
  for (const r of rows) {
    for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = null;
  }
  for (const c of cols) {
    for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = null;
  }
  return newGrid;
}

function canPieceFitAnywhere(grid: Grid, piece: Piece): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (canPlace(grid, piece, r, c)) return true;
    }
  }
  return false;
}

function countCells(shape: boolean[][]): number {
  return shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
}

function generatePieces(rng: () => number, nextId: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < 3; i++) {
    const defIdx = Math.floor(rng() * PIECE_DEFS.length);
    const colorIdx = Math.floor(rng() * TILE_COLORS.length);
    pieces.push({
      shape: PIECE_DEFS[defIdx],
      color: TILE_COLORS[colorIdx],
      id: nextId + i,
    });
  }
  return pieces;
}

// === Component ===

const BlockBlast: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, partnerUser, tripMeta } = useStore();
  const showToast = useToast();

  // Daily mode
  const [isDaily, setIsDaily] = useState(true);
  const [rng, setRng] = useState(() => mulberry32(dateSeed()));
  const [nextPieceId, setNextPieceId] = useState(0);

  // Game state
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [selectedPieceIdx, setSelectedPieceIdx] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [hoverCells, setHoverCells] = useState<Set<string>>(new Set());
  const [hoverValid, setHoverValid] = useState(true);

  // Timer refs for cleanup
  const cheerTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hoverRef = useRef<{ row: number; col: number } | null>(null);

  useEffect(() => {
    return () => {
      clearTimeout(cheerTimerRef.current);
      clearTimeout(clearTimerRef.current);
    };
  }, []);

  // High scores from localStorage
  const [bestScore, setBestScore] = useState(() => {
    try { return parseInt(localStorage.getItem('bb_best') || '0', 10); } catch { return 0; }
  });
  const [dailyBest, setDailyBest] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bb_daily') || '{}');
      return (stored[dateKey()] as number) || 0;
    } catch { return 0; }
  });
  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem('bb_streak') || '0', 10); } catch { return 0; }
  });

  // Partner's daily score via Firebase
  const [partnerDailyScore, setPartnerDailyScore] = useState<number | null>(null);
  const [rewardPhrase, setRewardPhrase] = useState<typeof REWARD_PHRASES[0] | null>(null);
  const [unlockedReveal, setUnlockedReveal] = useState(false);

  // Listen for partner's daily score
  const partnerScoreRef = useRef<number | null>(null);
  useEffect(() => {
    if (!tripMeta?.id || !partnerUser) return;
    const today = dateKey();
    const path = `trips/${tripMeta.id}/puzzle/${today}`;
    const unsub = listenDoc(path, (data) => {
      const ps = data?.[partnerUser.uid] as number | undefined;
      if (ps !== undefined) {
        const isNew = partnerScoreRef.current === null || ps > partnerScoreRef.current;
        partnerScoreRef.current = ps;
        setPartnerDailyScore(ps);
        if (isNew && ps > 0) {
          showToast(`${partnerUser.displayName?.split(' ')[0]} scored ${ps} in Piazza Puzzle!`, 'info');
        }
      }
    });
    return () => unsub();
  }, [tripMeta?.id, partnerUser?.uid, showToast]);

  // Shared init/reset logic
  const initGame = useCallback((daily: boolean) => {
    clearTimeout(cheerTimerRef.current);
    clearTimeout(clearTimerRef.current);
    const r = daily ? mulberry32(dateSeed()) : mulberry32(Date.now());
    setRng(() => r);
    const initial = generatePieces(r, 0);
    setPieces(initial);
    setNextPieceId(3);
    setGrid(createEmptyGrid());
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setCheer(null);
    setSelectedPieceIdx(null);
    setHoverCells(new Set());
    hoverRef.current = null;
    setRewardPhrase(null);
    setUnlockedReveal(false);
  }, []);

  // Init on mode change
  useEffect(() => { initGame(isDaily); }, [isDaily]);

  // Check game over
  useEffect(() => {
    if (gameOver || pieces.length === 0) return;
    const anyFits = pieces.some((p) => canPieceFitAnywhere(grid, p));
    if (!anyFits) {
      setGameOver(true);

      // Pick a reward phrase
      setRewardPhrase(REWARD_PHRASES[Math.floor(Math.random() * REWARD_PHRASES.length)]);

      // Save scores
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem('bb_best', String(score));
      }
      if (isDaily && score > dailyBest) {
        setDailyBest(score);
        try {
          const stored = JSON.parse(localStorage.getItem('bb_daily') || '{}');
          stored[dateKey()] = score;
          localStorage.setItem('bb_daily', JSON.stringify(stored));
          // Update streak using same parsed object
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const playedYesterday = (stored[dateKey(yesterday)] || 0) > 0;
          const newStreak = playedYesterday ? streak + 1 : 1;
          setStreak(newStreak);
          localStorage.setItem('bb_streak', String(newStreak));
        } catch { /* ok */ }

        // Sync daily score to Firebase
        if (tripMeta?.id && currentUser) {
          const today = dateKey();
          writeDoc(`trips/${tripMeta.id}/puzzle/${today}`, {
            [currentUser.uid]: score,
          }).catch(() => {});
        }
      }

      // Unlock a reveal tile if score hits threshold (daily mode only)
      if (isDaily && score >= REVEAL_UNLOCK_THRESHOLD) {
        const tripStart = new Date('2026-05-02T00:00:00');
        const now = new Date();
        const daysBeforeTrip = Math.ceil((tripStart.getTime() - now.getTime()) / 864e5);
        const dateUnlocked = Math.max(0, Math.min(TOTAL_REVEAL_TILES, TOTAL_REVEAL_TILES - daysBeforeTrip));
        // Unlock the next tile beyond what's date-unlocked
        if (dateUnlocked < TOTAL_REVEAL_TILES) {
          try {
            const key = 'bb_reveal_unlocks';
            const unlocks: number[] = JSON.parse(localStorage.getItem(key) || '[]');
            if (!unlocks.includes(dateUnlocked)) {
              unlocks.push(dateUnlocked);
              localStorage.setItem(key, JSON.stringify(unlocks));
              setUnlockedReveal(true);
              showToast('Bonus reveal tile unlocked!', 'success');
            }
          } catch { /* ok */ }
        }
      }
    }
  }, [pieces, grid, score, bestScore, dailyBest, streak, isDaily, gameOver, tripMeta?.id, currentUser, showToast]);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (gameOver || selectedPieceIdx === null) return;
      const piece = pieces[selectedPieceIdx];
      if (!piece) return;

      if (!canPlace(grid, piece, row, col)) return;

      // Place piece
      let newGrid = placePiece(grid, piece, row, col);
      let earned = countCells(piece.shape);

      // Check lines
      const { rows, cols } = findFullLines(newGrid);
      const totalLines = rows.length + cols.length;

      if (totalLines > 0) {
        // Show clearing animation
        const clearing = new Set<string>();
        for (const r of rows) {
          for (let c = 0; c < GRID_SIZE; c++) clearing.add(`${r}-${c}`);
        }
        for (const c of cols) {
          for (let r = 0; r < GRID_SIZE; r++) clearing.add(`${r}-${c}`);
        }
        setClearingCells(clearing);

        const newCombo = combo + 1;
        setCombo(newCombo);
        earned += totalLines * GRID_SIZE + (newCombo > 1 ? newCombo * 10 : 0);

        // Cheer
        const cheerIdx = Math.min(totalLines - 1 + (newCombo > 1 ? 2 : 0), ITALIAN_CHEERS.length - 1);
        setCheer(ITALIAN_CHEERS[cheerIdx]);
        clearTimeout(cheerTimerRef.current);
        cheerTimerRef.current = setTimeout(() => setCheer(null), 1200);

        // Haptic
        if (navigator.vibrate) navigator.vibrate(totalLines > 1 ? [50, 50, 100] : [50]);

        // Delay clear for animation
        const clearedGrid = clearLines(newGrid, rows, cols);
        clearTimeout(clearTimerRef.current);
        clearTimerRef.current = setTimeout(() => {
          setGrid(clearedGrid);
          setClearingCells(new Set());
        }, 300);
      } else {
        setCombo(0);
        setGrid(newGrid);
      }

      setScore((s) => s + earned);

      // Remove used piece
      const remaining = pieces.filter((_, i) => i !== selectedPieceIdx);
      setSelectedPieceIdx(null);
      setHoverCells(new Set());
      hoverRef.current = null;

      // If all 3 used, deal new batch
      if (remaining.length === 0) {
        const newPieces = generatePieces(rng, nextPieceId);
        setPieces(newPieces);
        setNextPieceId((id) => id + 3);
      } else {
        setPieces(remaining);
      }
    },
    [grid, pieces, selectedPieceIdx, gameOver, combo, rng, nextPieceId]
  );

  const handleCellHover = useCallback(
    (row: number, col: number) => {
      if (selectedPieceIdx === null) return;
      // Skip if same cell
      if (hoverRef.current?.row === row && hoverRef.current?.col === col) return;
      hoverRef.current = { row, col };
      const piece = pieces[selectedPieceIdx];
      if (!piece) return;
      const cells = new Set<string>();
      const valid = canPlace(grid, piece, row, col);
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c]) cells.add(`${row + r}-${col + c}`);
        }
      }
      setHoverCells(cells);
      setHoverValid(valid);
    },
    [selectedPieceIdx, pieces, grid]
  );

  const handleGridLeave = useCallback(() => {
    if (hoverCells.size === 0) return;
    setHoverCells(new Set());
    hoverRef.current = null;
  }, [hoverCells.size]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar bg-[#f9f7f4] dark:bg-black"
    >
      <div className="max-w-lg mx-auto px-4 pt-4 pb-32 flex flex-col items-center gap-4">
        {/* Header */}
        <div className="w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white dark:bg-white/10 shadow flex items-center justify-center text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-white/5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-[#194f4c] dark:text-white tracking-tight">Piazza Puzzle</h1>
            <p className="text-[9px] font-bold text-[#ac3d29] uppercase tracking-widest">
              {isDaily ? 'Sfida del Giorno' : 'Gioco Libero'}
            </p>
          </div>
          <div className="w-9" />
        </div>

        {/* Score Bar */}
        <div className="w-full flex items-center justify-between bg-white dark:bg-[#1a1a1a] rounded-2xl px-5 py-3 shadow-sm border border-slate-100 dark:border-white/5">
          <div className="text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Punti</p>
            <p className="text-2xl font-bold text-[#194f4c] dark:text-white font-serif">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Migliore</p>
            <p className="text-lg font-bold text-slate-500 dark:text-slate-300">{isDaily ? dailyBest : bestScore}</p>
          </div>
          {isDaily && streak > 0 && (
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Serie</p>
              <p className="text-lg font-bold text-[#ac3d29]">{streak}</p>
            </div>
          )}
          {isDaily && partnerUser && partnerDailyScore !== null && partnerDailyScore > 0 && (
            <div className="text-center">
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{partnerUser.displayName?.split(' ')[0]}</p>
              <p className="text-lg font-bold text-[#ac3d29]">{partnerDailyScore}</p>
            </div>
          )}
          <div className="flex gap-1.5">
            <button
              onClick={() => { setIsDaily(true); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${isDaily ? 'bg-[#194f4c] text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}
            >
              Daily
            </button>
            <button
              onClick={() => { setIsDaily(false); }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${!isDaily ? 'bg-[#194f4c] text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}
            >
              Free
            </button>
          </div>
        </div>

        {/* Cheer overlay */}
        <AnimatePresence>
          {cheer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <span className="font-serif italic text-5xl font-bold text-[#ac3d29] drop-shadow-lg">{cheer}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div
          className="relative bg-[#e8ddd0] dark:bg-[#1e1b17] rounded-2xl p-2 shadow-inner border border-[#d4c4b0] dark:border-white/5"
          onMouseLeave={handleGridLeave}
          onTouchEnd={handleGridLeave}
        >
          <div
            className="grid gap-[2px]"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {(() => {
              const selectedPiece = selectedPieceIdx !== null ? pieces[selectedPieceIdx] : null;
              return grid.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  const isClearing = clearingCells.has(key);
                  const isHover = hoverCells.has(key);

                  return (
                    <motion.button
                      key={key}
                      onClick={() => handleCellClick(r, c)}
                      onMouseEnter={() => handleCellHover(r, c)}
                      onTouchStart={(e) => { e.preventDefault(); handleCellClick(r, c); }}
                      animate={isClearing ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
                      transition={isClearing ? { duration: 0.3 } : { duration: 0.15 }}
                      className="aspect-square rounded-md transition-colors relative"
                      style={{
                        width: `clamp(32px, calc((100vw - 64px) / ${GRID_SIZE}), 48px)`,
                        backgroundColor: cell
                          ? cell
                          : isHover
                          ? hoverValid
                            ? selectedPiece
                              ? selectedPiece.color + '55'
                              : '#19504c33'
                            : '#ef444455'
                          : 'transparent',
                        border: cell
                          ? '1px solid rgba(255,255,255,0.15)'
                          : '1px solid rgba(0,0,0,0.06)',
                        boxShadow: cell
                          ? 'inset 0 -2px 3px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.2)'
                          : 'inset 0 1px 2px rgba(0,0,0,0.04)',
                      }}
                    />
                  );
                })
              );
            })()}
          </div>
        </div>

        {/* Piece Tray */}
        <div className="w-full bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-around gap-3">
            {pieces.map((piece, idx) => {
              const rows = piece.shape.length;
              const cols = Math.max(...piece.shape.map((r) => r.length));
              const miniSize = Math.min(14, Math.floor(56 / Math.max(rows, cols)));
              const isSelected = selectedPieceIdx === idx;
              const fitsAnywhere = canPieceFitAnywhere(grid, piece);

              return (
                <button
                  key={piece.id}
                  onClick={() => setSelectedPieceIdx(isSelected ? null : idx)}
                  className={`p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-[#194f4c]/10 dark:bg-white/10 ring-2 ring-[#194f4c] dark:ring-white scale-110'
                      : fitsAnywhere
                      ? 'hover:bg-slate-50 dark:hover:bg-white/5'
                      : 'opacity-30'
                  }`}
                >
                  <div
                    className="grid gap-[1px]"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, ${miniSize}px)`,
                      gridTemplateRows: `repeat(${rows}, ${miniSize}px)`,
                    }}
                  >
                    {piece.shape.map((row, r) =>
                      row.map((cell, c) => (
                        <div
                          key={`${r}-${c}`}
                          className="rounded-[2px]"
                          style={{
                            width: miniSize,
                            height: miniSize,
                            backgroundColor: cell ? piece.color : 'transparent',
                            boxShadow: cell
                              ? 'inset 0 -1px 2px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.15)'
                              : 'none',
                          }}
                        />
                      ))
                    )}
                  </div>
                </button>
              );
            })}
            {/* Empty slots for used pieces */}
            {Array.from({ length: 3 - pieces.length }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 w-16 h-16" />
            ))}
          </div>
        </div>

        {/* How to play hint */}
        {selectedPieceIdx === null && !gameOver && pieces.length > 0 && (
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
            Tap a piece, then tap the grid to place it
          </p>
        )}

        {/* Game Over */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6"
            >
              <motion.div
                initial={{ y: 30 }}
                animate={{ y: 0 }}
                className="bg-white dark:bg-[#1a1a1a] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-white/5"
              >
                <p className="text-[10px] font-bold text-[#ac3d29] uppercase tracking-widest mb-2">Partita Finita</p>
                <h2 className="font-serif text-4xl font-bold text-[#194f4c] dark:text-white mb-1">{score}</h2>
                <p className="text-sm text-slate-400 mb-1">punti</p>

                {score >= bestScore && score > 0 && (
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-bold text-[#ac3d29] mb-3"
                  >
                    Nuovo record!
                  </motion.p>
                )}

                {/* Partner score comparison */}
                {isDaily && partnerUser && partnerDailyScore !== null && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">
                    {partnerUser.displayName?.split(' ')[0]}: {partnerDailyScore} punti
                    {score > partnerDailyScore ? ' — you win!' : score === partnerDailyScore ? ' — tied!' : ''}
                  </p>
                )}

                {isDaily && streak > 0 && (
                  <div className="flex items-center justify-center gap-1 mb-3">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold text-[#ac3d29]">{streak} day streak</span>
                  </div>
                )}

                {/* Reveal unlock notification */}
                {unlockedReveal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 mb-3"
                  >
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      Bonus reveal tile unlocked!
                    </p>
                    <button
                      onClick={() => navigate('/reveals')}
                      className="text-[10px] text-emerald-600 dark:text-emerald-300 underline mt-0.5"
                    >
                      View Daily Reveals
                    </button>
                  </motion.div>
                )}

                {/* Reward phrase */}
                {rewardPhrase && (
                  <div className="bg-slate-50 dark:bg-white/5 rounded-xl px-4 py-3 mb-3">
                    <p className="font-serif italic text-lg text-slate-900 dark:text-white">
                      &ldquo;{rewardPhrase.italian}&rdquo;
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{rewardPhrase.english}</p>
                    <p className="text-[10px] text-[#ac3d29] mt-0.5">/{rewardPhrase.pronunciation}/</p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => initGame(isDaily)}
                    className="flex-1 bg-[#194f4c] text-white font-bold py-3 rounded-xl text-sm hover:bg-[#194f4c]/90 transition-colors"
                  >
                    {isDaily ? 'Riprova' : 'Nuova Partita'}
                  </button>
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                  >
                    Esci
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default BlockBlast;
