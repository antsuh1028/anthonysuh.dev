/**
 * Mascot controller. Wires physics, sprite, and drag together.
 * Plain JS — no imports. Depends on: physics.js, stateMachine.js,
 *            sprite.js, dragController.js (all loaded before this).
 *
 * Usage (from messageListener.js):
 *   var pet = new window.PZAnteater({ spriteUrl: '...' });
 *   pet.spawn();
 *   pet.despawn();
 */

(function () {

  var STATES = PZStateMachine.STATES;
  var DIR    = PZStateMachine.DIR;

  /**
   * @param {object} opts
   * @param {string} [opts.spriteUrl]  — URL to the sprite sheet PNG (when we have it)
   * @param {number} [opts.spawnX]     — initial x position (default: center)
   * @param {number} [opts.spawnY]     — initial y position (default: -64, above screen)
   */
  function Anteater(opts) {
    opts = opts || {};
    this._spriteUrl = opts.spriteUrl || null;
    this._spawnX    = opts.spawnX    != null ? opts.spawnX : Math.floor(window.innerWidth / 2 - 32);
    this._spawnY    = opts.spawnY    != null ? opts.spawnY : -64;

    this._body   = null;
    this._fsm    = null;
    this._sprite = null;
    this._drag   = null;

    this._rafId    = null;
    this._lastTime = null;
    this._active   = false;
    this._standStillUntil = 0;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._houseEl      = null;
    this._houseRect    = null;
    this._houseHovered = false;
    this._onMouseMove = this._onMouseMove.bind(this);
    this._boundLoop   = this._loop.bind(this); // bind once to avoid per-frame allocation
  }

  Anteater.prototype.standStillFor = function (ms) {
    this._standStillUntil = performance.now() + (ms || 0);
  };

  Anteater.prototype.spawn = function () {
    if (this._active) return;
    this._active = true;

    // Build physics body
    this._body = new PZPhysics.PhysicsBody(this._spawnX, this._spawnY);

    // Build state machine
    this._fsm = new PZStateMachine.StateMachine();

    // Build sprite (DOM element)
    this._sprite = new PZSprite.Sprite(this._spriteUrl);
    this._sprite.mount();

    // Attach drag controller after sprite is in the DOM
    this._drag = new PZDrag.DragController(this._sprite.el, this._body, this._fsm);
    this._drag.attach();

    document.addEventListener('mousemove', this._onMouseMove);

    // Pointer lock for MOUSE_GRAB prank
    this._onFsmChange = this._onFsmChange.bind(this);
    this._fsm.onChange(this._onFsmChange);

    // Start game loop ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    this._lastTime = performance.now();
    this._rafId = requestAnimationFrame(this._boundLoop);

    console.log('anteater spawned');
  };

  Anteater.prototype.despawn = function () {
    if (!this._active) return;
    this._active = false;

    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    if (document.pointerLockElement) document.exitPointerLock();
    document.removeEventListener('mousemove', this._onMouseMove);
    if (this._drag)   this._drag.detach();
    if (this._sprite) this._sprite.unmount();
    if (this._houseEl) {
      if (this._houseEl.parentNode) this._houseEl.parentNode.removeChild(this._houseEl);
      this._houseEl = null;
    }
    this._houseRect    = null;
    this._houseHovered = false;

    this._body   = null;
    this._fsm    = null;
    this._sprite = null;
    this._drag   = null;
    this._rafId  = null;

    console.log('anteater despawned');
  };

  Anteater.prototype.isActive = function () {
    return this._active;
  };

  Anteater.prototype._onMouseMove = function (e) {
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
  };

  Anteater.prototype._onFsmChange = function (oldState, newState) {
    var self = this;

    // House drop-zone: spawn on grab, despawn anteater if dropped on house
    if (newState === STATES.DRAGGED) {
      this._createHouse();
    } else if (oldState === STATES.DRAGGED) {
      if (this._checkHouseOverlap()) {
        this._removeHouse();
        setTimeout(function () { self.despawn(); }, 120);
        return;
      }
      this._removeHouse();
    }

    if (newState === STATES.MOUSE_GRAB) {
      this._mouseGrabPhase = 'jump';
      var tx = this._lastMouseX || window.innerWidth / 2;
      var ty = this._lastMouseY || window.innerHeight / 2;
      var cx = this._body.x + this._body.w / 2;
      var cy = this._body.y + this._body.h / 2;
      var dx = tx - cx;
      var dy = ty - cy;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var GRAVITY = 0.25;
      var MAG = 50;
      var vxBase = (dx / len) * MAG;
      var vyBase = (dy / len) * MAG;
      if (ty < cy) {
        var rise = cy - ty;
        var vyNeed = -Math.sqrt(2 * GRAVITY * rise) * 2.5;
        if (vyBase > vyNeed) vyBase = vyNeed;
      }
      this._body.vx = vxBase;
      this._body.vy = vyBase;
      this._body.onGround = false;
      this._body.thrown = false;
      this._mouseGrabTargetX = tx;
      this._mouseGrabTargetY = ty;
      this._clearPointerLockListeners();
      var onFailure = function () {
        self._clearPointerLockListeners();
        if (self._fsm && self._fsm.state === STATES.MOUSE_GRAB && self._body) {
          self._body.onGround = false;
          self._body.vy = 0;
          self._body.y -= 40;
          self._fsm._go(STATES.FALLING);
        }
        document.exitPointerLock && document.exitPointerLock();
      };
      var onError = function () { onFailure(); };
      var onChange = function () {
        if (!document.pointerLockElement) onFailure();
      };
      this._pointerLockTimeout = setTimeout(function () {
        if (!document.pointerLockElement && self._fsm && self._fsm.state === STATES.MOUSE_GRAB) {
          onFailure();
        }
      }, 250);
      document.addEventListener('pointerlockerror', onError, { once: true });
      document.addEventListener('pointerlockchange', function cb() {
        document.removeEventListener('pointerlockchange', cb);
        if (!document.pointerLockElement) onFailure();
      }, { once: true });
      this._pointerLockCleanup = function () {
        if (self._pointerLockTimeout) clearTimeout(self._pointerLockTimeout);
        self._pointerLockTimeout = null;
        self._pointerLockCleanup = null;
      };
      document.body.requestPointerLock && document.body.requestPointerLock();
    } else if (oldState === STATES.MOUSE_GRAB) {
      this._mouseGrabPhase = null;
      this._clearPointerLockListeners();
      document.exitPointerLock && document.exitPointerLock();
    }
  };

  Anteater.prototype._clearPointerLockListeners = function () {
    if (this._pointerLockTimeout) {
      clearTimeout(this._pointerLockTimeout);
      this._pointerLockTimeout = null;
    }
    this._pointerLockCleanup = null;
  };

  // House drop-zone ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Anteater.prototype._createHouse = function () {
    if (this._houseEl) return;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var HOUSE_W = 72, HOUSE_H = 72;
    var floorOffset = PZPhysics.FLOOR_OFFSET || 25;
    // Place on the opposite horizontal third from the anteater
    var houseX = this._body.x < vw / 2
      ? Math.floor(vw * 0.72)
      : Math.floor(vw * 0.08);
    var houseY = vh - HOUSE_H - floorOffset - 8;

    var house = document.createElement('div');
    house.id = 'pocketzot-house';
    house.style.cssText = [
      'position:fixed',
      'left:' + houseX + 'px',
      'top:' + houseY + 'px',
      'width:' + HOUSE_W + 'px',
      'height:' + HOUSE_H + 'px',
      'font-size:52px',
      'line-height:' + HOUSE_H + 'px',
      'text-align:center',
      'z-index:2147483645',
      'pointer-events:none',
      'user-select:none',
      'transition:transform 0.15s ease, filter 0.15s ease, opacity 0.15s ease',
      'transform:scale(0)',
      'opacity:0',
    ].join(';');
    house.textContent = '🏠'; // 🏠
    document.body.appendChild(house);

    this._houseRect    = { x: houseX, y: houseY, w: HOUSE_W, h: HOUSE_H };
    this._houseEl      = house;
    this._houseHovered = false;

    setTimeout(function () {
      house.style.transform = 'scale(1)';
      house.style.opacity   = '1';
    }, 10);
  };

  Anteater.prototype._removeHouse = function () {
    if (!this._houseEl) return;
    var house      = this._houseEl;
    this._houseEl  = null;
    this._houseRect = null;
    house.style.transform = 'scale(0)';
    house.style.opacity   = '0';
    setTimeout(function () {
      if (house.parentNode) house.parentNode.removeChild(house);
    }, 200);
  };

  Anteater.prototype._checkHouseOverlap = function () {
    if (!this._houseRect || !this._body) return false;
    var b = this._body, h = this._houseRect;
    return b.x < h.x + h.w && b.x + b.w > h.x &&
           b.y < h.y + h.h && b.y + b.h > h.y;
  };

  // Game Loop ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  Anteater.prototype._loop = function (timestamp) {
    if (!this._active) return;

    // Cap dt to 50ms to avoid spiral-of-death after tab sleep/resume
    var dt = Math.min(timestamp - this._lastTime, 50);
    this._lastTime = timestamp;

    this._tick(dt);
    this._rafId = requestAnimationFrame(this._boundLoop);
  };

  Anteater.prototype._tick = function (dt) {
    var body = this._body;
    var fsm  = this._fsm;
    var vw   = window.innerWidth;
    var vh   = window.innerHeight;
    var isDragging = (fsm.state === STATES.DRAGGED);
    var isMouseGrab = (fsm.state === STATES.MOUSE_GRAB);
    var standStill = performance.now() < this._standStillUntil;

    if (standStill) {
      fsm.state = STATES.IDLE;
      fsm._timer = 0;
      body.vx = 0;
      if (body.onGround) body.vy = 0;
    } else {
      // 1. Advance state machine
      fsm.update(dt, body);

      // 2. Apply locomotion velocity based on current state
      if (fsm.state === STATES.MOUSE_GRAB) {
        var floorY = vh - body.h - (PZPhysics.FLOOR_OFFSET || 25);
        if (this._mouseGrabPhase === 'jump') {
          var tx = this._mouseGrabTargetX;
          var ty = this._mouseGrabTargetY;
          var cy = body.y + body.h / 2;
          var cx = body.x + body.w / 2;
          if (cy > ty) {
            var dx = tx - cx;
            var dy = ty - cy;
            var len = Math.sqrt(dx * dx + dy * dy) || 1;
            body.vx += (dx / len) * 2;
            body.vy += (dy / len) * 2;
          }
          body.step(vw, vh, false, dt);
          cy = body.y + body.h / 2;
          var overlap = tx >= body.x && tx <= body.x + body.w && ty >= body.y && ty <= body.y + body.h;
          var reachedMouseY = cy <= ty;
          if (overlap || body.onGround || reachedMouseY) {
            this._mouseGrabPhase = 'run';
            fsm._timer = 0;
            body.y = floorY;
            body.onGround = true;
            body.vx = 0;
            body.vy = 0;
          }
        } else {
          var runSpeed = (PZPhysics.MOUSE_GRAB_RUN_SPEED || 3) * (dt / 16.67);
          body.y = floorY;
          body.onGround = true;
          body.vx = 0;
          body.vy = 0;
          body.thrown = false;
          body.x += runSpeed * fsm.direction;
          if (body.x <= 0) { body.x = 0; fsm.direction = DIR.RIGHT; }
          if (body.x + body.w >= vw) { body.x = vw - body.w; fsm.direction = DIR.LEFT; }
        }
      } else if (fsm.state === STATES.WALKING) {
        body.applyWalkVelocity(fsm.direction);
      } else if (fsm.state === STATES.LANDING || fsm.state === STATES.IDLE) {
        body.vx = 0;
        if (body.onGround) body.vy = 0;
      }
    }
    // FALLING / THROWN: gravity + integration handled by physics.step()
    // DRAGGED: drag controller sets body.x/y directly, physics.step() is no-op
    // MOUSE_GRAB: position driven above; skip physics.step for x

    // 3. Step physics (no-op for DRAGGED; MOUSE_GRAB already set body)
    if (!isMouseGrab) {
      body.step(vw, vh, isDragging, dt);
    }

    // 3b. While dragging: switch to Grab State after 300ms of no movement
    if (isDragging) this._drag.updateIdleCheck(performance.now());

    // 3c. While dragging: highlight house when hovering over it
    if (isDragging && this._houseEl) {
      var over = this._checkHouseOverlap();
      if (over !== this._houseHovered) {
        this._houseHovered = over;
        this._houseEl.style.filter    = over ? 'drop-shadow(0 0 10px gold) brightness(1.35)' : '';
        this._houseEl.style.transform = over ? 'scale(1.25)' : 'scale(1)';
      }
    }

    // 4. Render (pass body for THROWN velocity-based rotation)
    var renderState = fsm.state;
    if (fsm.state === STATES.MOUSE_GRAB && this._mouseGrabPhase === 'jump') {
      renderState = STATES.FALLING;
    }
    this._sprite.update(body.x, body.y, renderState, fsm.direction, dt, body);
  };

  // Expose globally
  window.PZAnteater = Anteater;
})();