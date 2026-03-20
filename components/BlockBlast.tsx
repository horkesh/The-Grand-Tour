import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useToast } from './Toast';
import { writeDoc, listenDoc } from '../services/firestoreSync';

const CELL_SIZE_CSS = `clamp(34px, calc((100vw - 48px) / 8), 50px)`;

// === Constants ===

const GRID_SIZE = 8;

// Rich gradient colors for blocks — each has a base and lighter highlight
const TILE_PALETTES = [
  { base: '#C94C2F', light: '#E8735A', dark: '#8B2A15' }, // terracotta
  { base: '#1B6B66', light: '#2D9E97', dark: '#0D3D3A' }, // teal
  { base: '#B8860B', light: '#DAA520', dark: '#7A5A07' }, // gold
  { base: '#7B3F8D', light: '#A65FBF', dark: '#4E2659' }, // purple
  { base: '#2980B9', light: '#5DADE2', dark: '#1A5276' }, // blue
  { base: '#D35400', light: '#E67E22', dark: '#873600' }, // orange
  { base: '#27AE60', light: '#52D689', dark: '#1A7A42' }, // green
];

const ITALIAN_CHEERS = [
  'Bravo!', 'Magnifico!', 'Bellissimo!', 'Perfetto!',
  'Fantastico!', 'Eccellente!', 'Meraviglioso!', 'Stupendo!',
];

const REVEAL_UNLOCK_THRESHOLD = 200;
const TOTAL_REVEAL_TILES = 30;

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

// Piece definitions
const PIECE_DEFS: boolean[][][] = [
  [[true]],
  [[true, true]],
  [[true], [true]],
  [[true, true, true]],
  [[true], [true], [true]],
  [[true, true, true, true]],
  [[true], [true], [true], [true]],
  [[true, true, true, true, true]],
  [[true], [true], [true], [true], [true]],
  [[true, true], [true, true]],
  [[true, true, true], [true, true, true], [true, true, true]],
  [[true, false], [true, false], [true, true]],
  [[true, true], [true, false], [true, false]],
  [[true, true], [false, true], [false, true]],
  [[false, true], [false, true], [true, true]],
  [[true, false], [true, true]],
  [[false, true], [true, true]],
  [[true, true], [true, false]],
  [[true, true], [false, true]],
  [[true, true, true], [false, true, false]],
  [[false, true, false], [true, true, true]],
  [[true, false], [true, true], [true, false]],
  [[false, true], [true, true], [false, true]],
  [[true, false], [true, true], [false, true]],
  [[false, true], [true, true], [true, false]],
  [[true, true], [true, true], [true, true]],
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
  colorIdx: number;
  id: number;
}

interface DragState {
  pieceIdx: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  gridRow: number | null;
  gridCol: number | null;
}

interface ScorePopup {
  id: number;
  value: number;
  x: number;
  y: number;
}

type Cell = number | null; // colorIdx or null
type Grid = Cell[][];

// === Helpers ===

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function canPlace(grid: Grid, shape: boolean[][], row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
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
        newGrid[row + r][col + c] = piece.colorIdx;
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
  for (const r of rows) for (let c = 0; c < GRID_SIZE; c++) newGrid[r][c] = null;
  for (const c of cols) for (let r = 0; r < GRID_SIZE; r++) newGrid[r][c] = null;
  return newGrid;
}

function canPieceFitAnywhere(grid: Grid, piece: Piece): boolean {
  for (let r = 0; r < GRID_SIZE; r++)
    for (let c = 0; c < GRID_SIZE; c++)
      if (canPlace(grid, piece.shape, r, c)) return true;
  return false;
}

function countCells(shape: boolean[][]): number {
  return shape.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
}

function generatePieces(rng: () => number, nextId: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < 3; i++) {
    pieces.push({
      shape: PIECE_DEFS[Math.floor(rng() * PIECE_DEFS.length)],
      colorIdx: Math.floor(rng() * TILE_PALETTES.length),
      id: nextId + i,
    });
  }
  return pieces;
}

// === Block Tile Component ===

const BlockTile: React.FC<{ colorIdx: number; size: number; mini?: boolean }> = ({ colorIdx, size, mini }) => {
  const p = TILE_PALETTES[colorIdx];
  const r = mini ? 2 : Math.max(3, size * 0.15);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: `linear-gradient(135deg, ${p.light} 0%, ${p.base} 50%, ${p.dark} 100%)`,
        boxShadow: mini
          ? `inset 0 1px 1px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)`
          : `inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -3px 4px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15)`,
        border: mini ? 'none' : `1px solid ${p.dark}44`,
      }}
    />
  );
};

// === Component ===

const BlockBlast: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, partnerUser, tripMeta } = useStore();
  const showToast = useToast();

  // Refs
  const gridRef = useRef<HTMLDivElement>(null);
  const floatingRef = useRef<HTMLDivElement>(null);
  const cheerTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const popupIdRef = useRef(0);
  const popupTimerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const cellSizeRef = useRef(40);

  // Cache cell size and update on resize
  useEffect(() => {
    const update = () => {
      if (gridRef.current) cellSizeRef.current = gridRef.current.getBoundingClientRect().width / GRID_SIZE;
    };
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    if (gridRef.current && ro) ro.observe(gridRef.current);
    return () => { ro?.disconnect(); clearTimeout(cheerTimerRef.current); clearTimeout(clearTimerRef.current); popupTimerRefs.current.forEach(clearTimeout); };
  }, []);

  // Mode
  const [isDaily, setIsDaily] = useState(true);
  const [rng, setRng] = useState(() => mulberry32(dateSeed()));
  const [nextPieceId, setNextPieceId] = useState(0);

  // Game state
  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cheer, setCheer] = useState<string | null>(null);
  const [clearingCells, setClearingCells] = useState<Set<string>>(new Set());
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);

  // Drag state
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<DragState | null>(null);

  // Scores
  const [bestScore, setBestScore] = useState(() => { try { return parseInt(localStorage.getItem('bb_best') || '0', 10); } catch { return 0; } });
  const [dailyBest, setDailyBest] = useState(() => { try { return (JSON.parse(localStorage.getItem('bb_daily') || '{}')[dateKey()] as number) || 0; } catch { return 0; } });
  const [streak, setStreak] = useState(() => { try { return parseInt(localStorage.getItem('bb_streak') || '0', 10); } catch { return 0; } });

  // Integrations
  const [partnerDailyScore, setPartnerDailyScore] = useState<number | null>(null);
  const [rewardPhrase, setRewardPhrase] = useState<typeof REWARD_PHRASES[0] | null>(null);
  const [unlockedReveal, setUnlockedReveal] = useState(false);
  const partnerScoreRef = useRef<number | null>(null);

  // Partner listener
  useEffect(() => {
    if (!tripMeta?.id || !partnerUser) return;
    const unsub = listenDoc(`trips/${tripMeta.id}/puzzle/${dateKey()}`, (data) => {
      const ps = data?.[partnerUser.uid] as number | undefined;
      if (ps !== undefined) {
        if (partnerScoreRef.current === null || ps > partnerScoreRef.current) {
          if (ps > 0) showToast(`${partnerUser.displayName?.split(' ')[0]} scored ${ps} in Piazza Puzzle!`, 'info');
        }
        partnerScoreRef.current = ps;
        setPartnerDailyScore(ps);
      }
    });
    return () => unsub();
  }, [tripMeta?.id, partnerUser?.uid, showToast]);

  // Init / reset
  const initGame = useCallback((daily: boolean) => {
    clearTimeout(cheerTimerRef.current);
    clearTimeout(clearTimerRef.current);
    popupTimerRefs.current.forEach(clearTimeout);
    popupTimerRefs.current = [];
    const r = daily ? mulberry32(dateSeed()) : mulberry32(Date.now());
    setRng(() => r);
    setPieces(generatePieces(r, 0));
    setNextPieceId(3);
    setGrid(createEmptyGrid());
    setScore(0);
    setCombo(0);
    setGameOver(false);
    setCheer(null);
    setDrag(null);
    dragRef.current = null;
    setClearingCells(new Set());
    setScorePopups([]);
    setRewardPhrase(null);
    setUnlockedReveal(false);
  }, []);

  useEffect(() => { initGame(isDaily); }, [isDaily]);

  // Game over check
  useEffect(() => {
    if (gameOver || pieces.length === 0) return;
    if (!pieces.some((p) => canPieceFitAnywhere(grid, p))) {
      setGameOver(true);
      setRewardPhrase(REWARD_PHRASES[Math.floor(Math.random() * REWARD_PHRASES.length)]);
      if (score > bestScore) { setBestScore(score); localStorage.setItem('bb_best', String(score)); }
      if (isDaily && score > dailyBest) {
        setDailyBest(score);
        try {
          const stored = JSON.parse(localStorage.getItem('bb_daily') || '{}');
          stored[dateKey()] = score;
          localStorage.setItem('bb_daily', JSON.stringify(stored));
          const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
          const newStreak = (stored[dateKey(yesterday)] || 0) > 0 ? streak + 1 : 1;
          setStreak(newStreak); localStorage.setItem('bb_streak', String(newStreak));
        } catch { /* ok */ }
        if (tripMeta?.id && currentUser) writeDoc(`trips/${tripMeta.id}/puzzle/${dateKey()}`, { [currentUser.uid]: score }).catch(() => {});
      }
      if (isDaily && score >= REVEAL_UNLOCK_THRESHOLD) {
        const daysBeforeTrip = Math.ceil((new Date('2026-05-02').getTime() - Date.now()) / 864e5);
        const dateUnlocked = Math.max(0, Math.min(TOTAL_REVEAL_TILES, TOTAL_REVEAL_TILES - daysBeforeTrip));
        if (dateUnlocked < TOTAL_REVEAL_TILES) {
          try {
            const unlocks: number[] = JSON.parse(localStorage.getItem('bb_reveal_unlocks') || '[]');
            if (!unlocks.includes(dateUnlocked)) {
              unlocks.push(dateUnlocked);
              localStorage.setItem('bb_reveal_unlocks', JSON.stringify(unlocks));
              setUnlockedReveal(true);
              showToast('Bonus reveal tile unlocked!', 'success');
            }
          } catch { /* ok */ }
        }
      }
    }
  }, [pieces, grid, score, bestScore, dailyBest, streak, isDaily, gameOver, tripMeta?.id, currentUser, showToast]);

  // === Placement logic ===
  const doPlace = useCallback((pieceIdx: number, row: number, col: number) => {
    const piece = pieces[pieceIdx];
    if (!piece || !canPlace(grid, piece.shape, row, col)) return;

    let newGrid = placePiece(grid, piece, row, col);
    let earned = countCells(piece.shape);
    const { rows, cols } = findFullLines(newGrid);
    const totalLines = rows.length + cols.length;

    if (totalLines > 0) {
      const clearing = new Set<string>();
      for (const r of rows) for (let c = 0; c < GRID_SIZE; c++) clearing.add(`${r}-${c}`);
      for (const c of cols) for (let r = 0; r < GRID_SIZE; r++) clearing.add(`${r}-${c}`);
      setClearingCells(clearing);

      const newCombo = combo + 1;
      setCombo(newCombo);
      earned += totalLines * GRID_SIZE + (newCombo > 1 ? newCombo * 10 : 0);

      const cheerIdx = Math.min(totalLines - 1 + (newCombo > 1 ? 2 : 0), ITALIAN_CHEERS.length - 1);
      setCheer(ITALIAN_CHEERS[cheerIdx]);
      clearTimeout(cheerTimerRef.current);
      cheerTimerRef.current = setTimeout(() => setCheer(null), 1200);

      if (navigator.vibrate) navigator.vibrate(totalLines > 1 ? [50, 50, 100] : [50]);

      const clearedGrid = clearLines(newGrid, rows, cols);
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => { setGrid(clearedGrid); setClearingCells(new Set()); }, 350);
    } else {
      setCombo(0);
      setGrid(newGrid);
    }

    // Score popup
    if (gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const cs = rect.width / GRID_SIZE;
      const popId = ++popupIdRef.current;
      setScorePopups(prev => [...prev, { id: popId, value: earned, x: rect.left + col * cs + cs, y: rect.top + row * cs }]);
      const tid = setTimeout(() => setScorePopups(prev => prev.filter(p => p.id !== popId)), 1000);
      popupTimerRefs.current.push(tid);
    }

    setScore((s) => s + earned);
    const remaining = pieces.filter((_, i) => i !== pieceIdx);
    if (remaining.length === 0) {
      const newPieces = generatePieces(rng, nextPieceId);
      setPieces(newPieces);
      setNextPieceId((id) => id + 3);
    } else {
      setPieces(remaining);
    }
  }, [grid, pieces, combo, rng, nextPieceId]);

  // === Drag handlers ===
  const getGridPos = useCallback((clientX: number, clientY: number, shape: boolean[][]) => {
    if (!gridRef.current) return { row: null as number | null, col: null as number | null };
    const rect = gridRef.current.getBoundingClientRect();
    const cs = cellSizeRef.current;
    const shapeRows = shape.length;
    const shapeCols = Math.max(...shape.map(r => r.length));
    const row = Math.round((clientY - rect.top - cs * 2) / cs - shapeRows / 2 + 0.5);
    const col = Math.round((clientX - rect.left) / cs - shapeCols / 2 + 0.5);
    return { row, col };
  }, []);

  // Move floating piece via DOM — no React re-render needed
  const updateFloatingPos = useCallback((clientX: number, clientY: number) => {
    if (floatingRef.current) {
      const offset = cellSizeRef.current * 2.5;
      floatingRef.current.style.left = `${clientX}px`;
      floatingRef.current.style.top = `${clientY - offset}px`;
    }
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, pieceIdx: number) => {
    if (gameOver) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const state: DragState = {
      pieceIdx, startX: e.clientX, startY: e.clientY,
      currentX: e.clientX, currentY: e.clientY, gridRow: null, gridCol: null,
    };
    dragRef.current = state;
    setDrag(state);
    updateFloatingPos(e.clientX, e.clientY);
  }, [gameOver, updateFloatingPos]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    // Always update floating piece position via DOM (no re-render)
    updateFloatingPos(e.clientX, e.clientY);
    d.currentX = e.clientX;
    d.currentY = e.clientY;
    // Only trigger React re-render when grid cell changes (for ghost preview)
    const piece = pieces[d.pieceIdx];
    if (!piece) return;
    const { row, col } = getGridPos(e.clientX, e.clientY, piece.shape);
    if (row !== d.gridRow || col !== d.gridCol) {
      d.gridRow = row;
      d.gridCol = col;
      setDrag({ ...d });
    }
  }, [pieces, getGridPos, updateFloatingPos]);

  const handlePointerUp = useCallback(() => {
    const d = dragRef.current;
    if (!d) return;
    const piece = pieces[d.pieceIdx];
    if (piece && d.gridRow !== null && d.gridCol !== null && canPlace(grid, piece.shape, d.gridRow, d.gridCol)) {
      doPlace(d.pieceIdx, d.gridRow, d.gridCol);
    }
    dragRef.current = null;
    setDrag(null);
  }, [pieces, grid, doPlace]);

  // Memoize ghost preview — only recomputes when drag cell or grid changes
  const { ghostCells, ghostValid } = useMemo(() => {
    const cells = new Set<string>();
    let valid = false;
    if (drag) {
      const piece = pieces[drag.pieceIdx];
      if (piece && drag.gridRow !== null && drag.gridCol !== null) {
        valid = canPlace(grid, piece.shape, drag.gridRow, drag.gridCol);
        for (let r = 0; r < piece.shape.length; r++)
          for (let c = 0; c < piece.shape[r].length; c++)
            if (piece.shape[r][c]) cells.add(`${drag.gridRow + r}-${drag.gridCol + c}`);
      }
    }
    return { ghostCells: cells, ghostValid: valid };
  }, [drag, pieces, grid]);

  // Memoize which pieces can fit (only changes when grid/pieces change, not during drag)
  const pieceFits = useMemo(() => pieces.map(p => canPieceFitAnywhere(grid, p)), [grid, pieces]);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] select-none"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="max-w-lg mx-auto px-3 pt-3 pb-4 flex flex-col items-center h-full">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-2 shrink-0">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div className="text-center">
            <h1 className="font-serif text-xl font-bold text-white tracking-tight">Piazza Puzzle</h1>
            <p className="text-[8px] font-bold text-amber-400 uppercase tracking-[0.3em]">
              {isDaily ? 'Sfida del Giorno' : 'Gioco Libero'}
            </p>
          </div>
          <div className="w-9" />
        </div>

        {/* Score Bar */}
        <div className="w-full flex items-center justify-between bg-white/5 backdrop-blur rounded-2xl px-4 py-2.5 mb-3 border border-white/10 shrink-0">
          <div className="text-center">
            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Punti</p>
            <p className="text-xl font-bold text-white font-serif tabular-nums">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Migliore</p>
            <p className="text-base font-bold text-white/60 tabular-nums">{isDaily ? dailyBest : bestScore}</p>
          </div>
          {isDaily && streak > 0 && (
            <div className="text-center">
              <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">Serie</p>
              <p className="text-base font-bold text-amber-400 tabular-nums">{streak}🔥</p>
            </div>
          )}
          {isDaily && partnerUser && partnerDailyScore !== null && partnerDailyScore > 0 && (
            <div className="text-center">
              <p className="text-[7px] font-bold text-white/40 uppercase tracking-wider">{partnerUser.displayName?.split(' ')[0]}</p>
              <p className="text-base font-bold text-rose-400 tabular-nums">{partnerDailyScore}</p>
            </div>
          )}
          <div className="flex gap-1">
            <button onClick={() => setIsDaily(true)} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${isDaily ? 'bg-amber-400 text-[#1a1a2e]' : 'bg-white/10 text-white/50'}`}>Daily</button>
            <button onClick={() => setIsDaily(false)} className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${!isDaily ? 'bg-amber-400 text-[#1a1a2e]' : 'bg-white/10 text-white/50'}`}>Free</button>
          </div>
        </div>

        {/* Cheer */}
        <AnimatePresence>
          {cheer && (
            <motion.div
              initial={{ opacity: 0, scale: 0.3, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.5, y: -40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            >
              <span className="font-serif italic text-6xl font-bold text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">{cheer}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Popups */}
        {scorePopups.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -60, scale: 1.5 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="fixed z-40 pointer-events-none font-bold text-amber-300 text-lg"
            style={{ left: p.x, top: p.y }}
          >
            +{p.value}
          </motion.div>
        ))}

        {/* Grid */}
        <div
          ref={gridRef}
          className="relative rounded-2xl p-1.5 shrink-0"
          style={{
            background: 'linear-gradient(145deg, #0a0e1a, #151b30)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 0 30px rgba(15,52,96,0.3)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="grid"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`, gap: 2 }}
          >
            {(() => {
              const dragColorIdx = drag ? pieces[drag.pieceIdx]?.colorIdx ?? 0 : 0;
              return grid.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r}-${c}`;
                  const isClearing = clearingCells.has(key);
                  const isGhost = ghostCells.has(key);

                  return (
                    <div
                      key={key}
                      className="relative"
                      style={{ width: CELL_SIZE_CSS, height: CELL_SIZE_CSS }}
                    >
                      {/* Empty cell background */}
                      <div
                        className="absolute inset-0 rounded-[4px] transition-colors duration-150"
                        style={{
                          background: isGhost
                            ? ghostValid
                              ? `${TILE_PALETTES[dragColorIdx].base}44`
                              : 'rgba(239,68,68,0.25)'
                            : 'rgba(255,255,255,0.03)',
                          border: isGhost && ghostValid
                            ? `1px solid ${TILE_PALETTES[dragColorIdx].base}88`
                            : '1px solid rgba(255,255,255,0.04)',
                        }}
                      />
                    {/* Filled cell */}
                    {cell !== null && (
                      <motion.div
                        className="absolute inset-0"
                        animate={isClearing ? { scale: [1, 1.15, 0], opacity: [1, 1, 0] } : { scale: 1, opacity: 1 }}
                        transition={isClearing ? { duration: 0.35, ease: 'easeInOut' } : { duration: 0.1 }}
                      >
                        <div
                          className="w-full h-full rounded-[5px]"
                          style={{
                            background: `linear-gradient(135deg, ${TILE_PALETTES[cell].light} 0%, ${TILE_PALETTES[cell].base} 50%, ${TILE_PALETTES[cell].dark} 100%)`,
                            boxShadow: `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -3px 5px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)`,
                            border: `1px solid ${TILE_PALETTES[cell].dark}66`,
                          }}
                        />
                        {/* Clearing glow */}
                        {isClearing && (
                          <motion.div
                            className="absolute inset-0 rounded-[5px]"
                            initial={{ boxShadow: '0 0 0px rgba(251,191,36,0)' }}
                            animate={{ boxShadow: '0 0 20px rgba(251,191,36,0.8)' }}
                            transition={{ duration: 0.2 }}
                          />
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })
            );})()}
          </div>
        </div>

        {/* Piece Tray */}
        <div className="w-full bg-white/5 backdrop-blur rounded-2xl p-3 mt-3 border border-white/10 shrink-0">
          <div className="flex items-center justify-around gap-2">
            {pieces.map((piece, idx) => {
              const rows = piece.shape.length;
              const cols = Math.max(...piece.shape.map((r) => r.length));
              const miniSize = Math.min(12, Math.floor(48 / Math.max(rows, cols)));
              const isDragging = drag?.pieceIdx === idx;

              return (
                <div
                  key={piece.id}
                  onPointerDown={(e) => handlePointerDown(e, idx)}
                  className={`p-3 rounded-xl cursor-grab active:cursor-grabbing transition-all ${
                    isDragging ? 'opacity-30 scale-90' : pieceFits[idx] ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ touchAction: 'none' }}
                >
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${cols}, ${miniSize}px)`,
                      gridTemplateRows: `repeat(${rows}, ${miniSize}px)`,
                      gap: 1,
                    }}
                  >
                    {piece.shape.map((row, r) =>
                      row.map((cell, c) => (
                        <div key={`${r}-${c}`} style={{ width: miniSize, height: miniSize }}>
                          {cell && <BlockTile colorIdx={piece.colorIdx} size={miniSize} mini />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
            {Array.from({ length: 3 - pieces.length }).map((_, i) => (
              <div key={`empty-${i}`} className="p-3 w-16 h-16" />
            ))}
          </div>
          {!gameOver && pieces.length > 0 && !drag && (
            <p className="text-[9px] text-white/30 text-center mt-1">Drag a piece onto the board</p>
          )}
        </div>
      </div>

      {/* Floating drag piece — positioned via DOM ref for performance */}
      {drag && pieces[drag.pieceIdx] && (() => {
        const dp = pieces[drag.pieceIdx];
        const cs = cellSizeRef.current;
        const dpCols = Math.max(...dp.shape.map(r => r.length));
        return (
          <div
            ref={floatingRef}
            className="fixed pointer-events-none z-30"
            style={{
              left: drag.currentX,
              top: drag.currentY - cs * 2.5,
              transform: 'translate(-50%, -50%) scale(1.1)',
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))',
            }}
          >
            <div className="grid" style={{ gridTemplateColumns: `repeat(${dpCols}, ${cs - 2}px)`, gap: 2 }}>
              {dp.shape.map((row, r) =>
                row.map((cell, c) => (
                  <div key={`${r}-${c}`} style={{ width: cs - 2, height: cs - 2 }}>
                    {cell && <BlockTile colorIdx={dp.colorIdx} size={cs - 2} />}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-gradient-to-b from-[#1a1a2e] to-[#16213e] rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-white/10"
            >
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.3em] mb-3">Partita Finita</p>
              <motion.h2
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
                className="font-serif text-5xl font-bold text-white mb-1"
              >{score}</motion.h2>
              <p className="text-sm text-white/40 mb-3">punti</p>

              {score >= bestScore && score > 0 && (
                <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-amber-400 mb-2">
                  Nuovo record!
                </motion.p>
              )}

              {isDaily && partnerUser && partnerDailyScore !== null && (
                <p className="text-xs text-white/40 mb-2">
                  {partnerUser.displayName?.split(' ')[0]}: {partnerDailyScore} punti
                  {score > partnerDailyScore ? ' — you win!' : score === partnerDailyScore ? ' — tied!' : ''}
                </p>
              )}

              {isDaily && streak > 0 && (
                <p className="text-xs font-bold text-amber-400 mb-3">🔥 {streak} day streak</p>
              )}

              {unlockedReveal && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-900/30 border border-emerald-500/30 rounded-xl px-4 py-2 mb-3">
                  <p className="text-xs font-bold text-emerald-400">Bonus reveal tile unlocked!</p>
                  <button onClick={() => navigate('/reveals')} className="text-[10px] text-emerald-300 underline mt-0.5">View Daily Reveals</button>
                </motion.div>
              )}

              {rewardPhrase && (
                <div className="bg-white/5 rounded-xl px-4 py-3 mb-4 border border-white/10">
                  <p className="font-serif italic text-lg text-white">&ldquo;{rewardPhrase.italian}&rdquo;</p>
                  <p className="text-xs text-white/40 mt-1">{rewardPhrase.english}</p>
                  <p className="text-[10px] text-amber-400 mt-0.5">/{rewardPhrase.pronunciation}/</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => initGame(isDaily)} className="flex-1 bg-amber-400 text-[#1a1a2e] font-bold py-3 rounded-xl text-sm hover:bg-amber-300 transition-colors">
                  {isDaily ? 'Riprova' : 'Nuova Partita'}
                </button>
                <button onClick={() => navigate(-1)} className="flex-1 bg-white/10 text-white/70 font-bold py-3 rounded-xl text-sm hover:bg-white/20 transition-colors">
                  Esci
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BlockBlast;
