export class UI {
  constructor() {
    this._startScreen    = document.getElementById('start-screen');
    this._gameoverScreen = document.getElementById('gameover-screen');
    this._ui             = document.getElementById('ui');

    this._ringsLeftEl  = document.getElementById('rings-left');
    this._scoreEl      = document.getElementById('score');
    this._powerContainer = document.getElementById('power-container');
    this._powerBar     = document.getElementById('power-bar');
    this._aimLabel     = document.getElementById('aim-label');
    this._finalScore   = document.getElementById('result-score');
    this._rankEl       = document.getElementById('result-rank');

    document.getElementById('start-btn') .addEventListener('click', () => this._startCb?.());
    document.getElementById('replay-btn').addEventListener('click', () => this._replayCb?.());
  }

  onStart(cb)  { this._startCb  = cb; }
  onReplay(cb) { this._replayCb = cb; }

  // ── screens ───────────────────────────────────────────────────────────────

  showStart() {
    this._startScreen.classList.remove('hidden');
    this._gameoverScreen.classList.add('hidden');
    this._ui.classList.add('hidden');
  }

  showHUD(ringsLeft, score) {
    this._startScreen.classList.add('hidden');
    this._gameoverScreen.classList.add('hidden');
    this._ui.classList.remove('hidden');
    this._updateCounters(ringsLeft, score);
  }

  showGameOver(score) {
    this._gameoverScreen.classList.remove('hidden');
    this._ui.classList.add('hidden');
    this._finalScore.textContent = `${score} 分`;
    this._rankEl.textContent = this._rankText(score);
  }

  _rankText(s) {
    if (s >= 600) return '🏆 套圈大师！完美！';
    if (s >= 350) return '🥇 太厉害了！高手！';
    if (s >= 180) return '🥈 不错！继续加油！';
    if (s >= 60)  return '🥉 还行，多练练吧！';
    if (s > 0)    return '😅 有点难，加油！';
    return '😭 一个都没套中...';
  }

  // ── HUD updates ───────────────────────────────────────────────────────────

  updateCounters(ringsLeft, score) { this._updateCounters(ringsLeft, score); }

  _updateCounters(ringsLeft, score) {
    this._ringsLeftEl.textContent = ringsLeft;
    this._scoreEl.textContent     = score;
  }

  showPowerBar()  { this._powerContainer.classList.add('visible'); }
  hidePowerBar()  { this._powerContainer.classList.remove('visible'); this._powerBar.style.width = '0%'; }
  setPower(p)     { this._powerBar.style.width = `${Math.round(p * 100)}%`; }

  setAimLabel(text) { this._aimLabel.textContent = text; }

  // ── score popup ───────────────────────────────────────────────────────────

  /**
   * @param {number} points
   * @param {{ x: number, y: number }} screenPos  — screen pixel coords
   */
  showScorePopup(points, screenPos) {
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.textContent = `+${points}`;
    el.style.left = `${screenPos.x - 25}px`;
    el.style.top  = `${screenPos.y - 10}px`;
    document.body.appendChild(el);

    // Trigger animation next tick
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(-90px)';
      el.style.opacity   = '0';
    });

    setTimeout(() => el.remove(), 1200);
  }
}
