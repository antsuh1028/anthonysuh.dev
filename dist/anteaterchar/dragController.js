/**
 * Throw velocity is estimated from a history of recent mouse positions.
 * px/frame velocity, matching the Shimeji-ee code (https://github.com/dinosu/shimeji-ee).
 */

var PZDrag = (function () {
  var HISTORY_WINDOW_MS  = 100;  // ms window for velocity estimation
  var HISTORY_SIZE       = 10;   // max samples to keep (Mem optimization, it's fine it's not exact)
  var MAX_THROW          = 24;   // px/frame cap
  var ASSUMED_FPS_MS     = 16.67; // 60fps converted to ms
  var GRAB_STATE_DELAY_MS = 300; // ms of no movement before switching back to Grab State

  function DragController(el, body, fsm) {
    this.el  = el;
    this.body = body;
    this.fsm  = fsm;

    this._dragging = false;
    this._offsetX  = 0;
    this._offsetY  = 0;
    this._history  = [];
    this._lastMoveTime = 0;

    // Bind so we can cleanly remove listeners
    this._onDown  = this._onDown.bind(this);
    this._onMove  = this._onMove.bind(this);
    this._onUp    = this._onUp.bind(this);
  }

  DragController.prototype.attach = function () {
    this.el.addEventListener('mousedown', this._onDown);
  };

  DragController.prototype.detach = function () {
    this.el.removeEventListener('mousedown', this._onDown);
    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseup',   this._onUp);
  };

  // Call from game loop each frame when dragging — switches to Grab State after 300ms idle
  DragController.prototype.updateIdleCheck = function (now) {
    if (!this._dragging || this.fsm.direction === 0) return;
    if (now - this._lastMoveTime >= GRAB_STATE_DELAY_MS) {
      this.fsm.direction = 0;
    }
  };

  DragController.prototype._onDown = function (e) {
    if (e.button !== 0) return;
    if (this.fsm.state === 'MOUSE_GRAB') return;
    e.preventDefault();
    e.stopPropagation();

    this._dragging = true;
    this._history  = [];

    var rect     = this.el.getBoundingClientRect();
    this._offsetX = e.clientX - rect.left;
    this._offsetY = e.clientY - rect.top;

    this.el.style.cursor = 'grabbing';
    this.fsm.startDrag();
    this.fsm.direction = 0; // neutral → show Grab State until user moves
    this._lastMoveTime = 0;
    this._record(e.clientX, e.clientY);

    document.addEventListener('mousemove', this._onMove);
    document.addEventListener('mouseup',   this._onUp);
  };

  DragController.prototype._onMove = function (e) {
    if (!this._dragging) return;

    var now = performance.now();

    // Update direction for sprite (game loop handles Grab State after 300ms idle)
    if (this._history.length >= 1) {
      var prev = this._history[this._history.length - 1];
      if (e.clientX > prev.x) {
        this.fsm.direction = 1;
        this._lastMoveTime = now;
      } else if (e.clientX < prev.x) {
        this.fsm.direction = -1;
        this._lastMoveTime = now;
      }
    }

    // Pin physics body directly to cursor (no gravity while dragging)
    this.body.x  = e.clientX - this._offsetX;
    this.body.y  = e.clientY - this._offsetY;
    this.body.vx = 0;
    this.body.vy = 0;
    this.body.onGround = false;
    this.body.thrown   = false;

    this._record(e.clientX, e.clientY);
  };

  DragController.prototype._onUp = function (e) {
    if (!this._dragging) return;
    this._dragging = false;

    this.el.style.cursor = 'grab';

    var vel = this._computeVelocity();
    var hasVel = Math.abs(vel.vx) + Math.abs(vel.vy) > 0.8;

    if (hasVel) {
      this.body.applyThrow(vel.vx, vel.vy);
    }

    this.fsm.endDrag(hasVel);

    document.removeEventListener('mousemove', this._onMove);
    document.removeEventListener('mouseup',   this._onUp);
  };

  DragController.prototype._record = function (x, y) {
    var now = performance.now();
    this._history.push({ x: x, y: y, t: now });
    if (this._history.length > HISTORY_SIZE) this._history.shift();
  };

  DragController.prototype._computeVelocity = function () {
    if (this._history.length < 2) return { vx: 0, vy: 0 };

    var now    = performance.now();
    var recent = this._history.filter(function (p) {
      return now - p.t <= HISTORY_WINDOW_MS;
    });

    if (recent.length < 2) return { vx: 0, vy: 0 };

    var first = recent[0];
    var last  = recent[recent.length - 1];
    var dt    = last.t - first.t;
    if (dt === 0) return { vx: 0, vy: 0 };

    // px/ms → px/frame
    var scale = ASSUMED_FPS_MS / dt;
    var vx = (last.x - first.x) * scale;
    var vy = (last.y - first.y) * scale;

    return {
      vx: Math.max(-MAX_THROW, Math.min(MAX_THROW, vx)),
      vy: Math.max(-MAX_THROW, Math.min(MAX_THROW, vy)),
    };
  };

  return { DragController: DragController };
})();
