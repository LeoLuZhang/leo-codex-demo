(() => {
  "use strict";

  const board = document.getElementById("board");
  const scoreEl = document.getElementById("score");
  const statusEl = document.getElementById("status");
  const restartBtn = document.getElementById("restart");
  const pauseBtn = document.getElementById("pause");
  const dpadButtons = Array.from(document.querySelectorAll("[data-dir]"));

  const ctx = board.getContext("2d");

  const CONFIG = {
    gridSize: 20,
    tickMs: 120,
    rng: Math.random,
  };

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  function createInitialState(config) {
    const mid = Math.floor(config.gridSize / 2);
    const snake = [
      { x: mid, y: mid },
      { x: mid - 1, y: mid },
      { x: mid - 2, y: mid },
    ];

    const state = {
      gridSize: config.gridSize,
      snake,
      direction: DIRS.right,
      nextDirection: DIRS.right,
      food: null,
      score: 0,
      status: "ready",
      rng: config.rng,
    };

    state.food = spawnFood(state);
    return state;
  }

  function spawnFood(state) {
    const empty = [];
    const occupied = new Set(state.snake.map((p) => `${p.x},${p.y}`));

    for (let y = 0; y < state.gridSize; y += 1) {
      for (let x = 0; x < state.gridSize; x += 1) {
        const key = `${x},${y}`;
        if (!occupied.has(key)) empty.push({ x, y });
      }
    }

    if (empty.length === 0) return null;

    const idx = Math.floor(state.rng() * empty.length);
    return empty[idx];
  }

  function isOpposite(a, b) {
    return a.x + b.x === 0 && a.y + b.y === 0;
  }

  function setDirection(state, dir) {
    if (isOpposite(state.direction, dir)) return;
    state.nextDirection = dir;
    if (state.status === "ready") state.status = "playing";
  }

  function step(state) {
    if (state.status !== "playing") return state;

    state.direction = state.nextDirection;
    const head = state.snake[0];
    const next = { x: head.x + state.direction.x, y: head.y + state.direction.y };

    if (next.x < 0 || next.x >= state.gridSize || next.y < 0 || next.y >= state.gridSize) {
      state.status = "over";
      return state;
    }

    const hit = state.snake.some((seg) => seg.x === next.x && seg.y === next.y);
    if (hit) {
      state.status = "over";
      return state;
    }

    state.snake.unshift(next);

    if (state.food && next.x === state.food.x && next.y === state.food.y) {
      state.score += 1;
      state.food = spawnFood(state);
      if (!state.food) {
        state.status = "over";
      }
    } else {
      state.snake.pop();
    }

    return state;
  }

  function drawGrid(ctx, size, cells) {
    ctx.strokeStyle = "#e4dbcf";
    ctx.lineWidth = 1;
    for (let i = 0; i <= cells; i += 1) {
      const p = i * size;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, size * cells);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(size * cells, p);
      ctx.stroke();
    }
  }

  function render(state) {
    const cell = board.width / state.gridSize;
    ctx.clearRect(0, 0, board.width, board.height);
    ctx.fillStyle = "#fdf9f2";
    ctx.fillRect(0, 0, board.width, board.height);

    drawGrid(ctx, cell, state.gridSize);

    if (state.food) {
      ctx.fillStyle = "#b3472f";
      ctx.fillRect(state.food.x * cell, state.food.y * cell, cell, cell);
    }

    state.snake.forEach((seg, index) => {
      ctx.fillStyle = index === 0 ? "#244a3f" : "#2f5d50";
      ctx.fillRect(seg.x * cell, seg.y * cell, cell, cell);
    });

    scoreEl.textContent = String(state.score);
    if (state.status === "ready") statusEl.textContent = "Ready";
    if (state.status === "playing") statusEl.textContent = "Playing";
    if (state.status === "paused") statusEl.textContent = "Paused";
    if (state.status === "over") statusEl.textContent = "Game Over";
  }

  let state = createInitialState(CONFIG);

  function restart() {
    state = createInitialState(CONFIG);
    pauseBtn.setAttribute("aria-pressed", "false");
    pauseBtn.textContent = "Pause";
    render(state);
  }

  function togglePause() {
    if (state.status === "over") return;
    if (state.status === "paused") {
      state.status = "playing";
      pauseBtn.setAttribute("aria-pressed", "false");
      pauseBtn.textContent = "Pause";
      return;
    }
    if (state.status === "playing" || state.status === "ready") {
      state.status = "paused";
      pauseBtn.setAttribute("aria-pressed", "true");
      pauseBtn.textContent = "Resume";
    }
  }

  function handleKey(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "w") setDirection(state, DIRS.up);
    if (key === "arrowdown" || key === "s") setDirection(state, DIRS.down);
    if (key === "arrowleft" || key === "a") setDirection(state, DIRS.left);
    if (key === "arrowright" || key === "d") setDirection(state, DIRS.right);
    if (key === " ") {
      e.preventDefault();
      togglePause();
    }
  }

  document.addEventListener("keydown", handleKey);
  restartBtn.addEventListener("click", restart);
  pauseBtn.addEventListener("click", togglePause);

  dpadButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = DIRS[btn.dataset.dir];
      if (dir) setDirection(state, dir);
    });
  });

  setInterval(() => {
    state = step(state);
    render(state);
  }, CONFIG.tickMs);

  render(state);

  window.__snakeGame = {
    createInitialState,
    step,
    spawnFood,
    isOpposite,
  };
})();
