/**
 * States:
 *   FALLING  — in air, gravity active (entry state on spawn)
 *   LANDING  — brief pause when feet first hit floor
 *   WALKING  — moving left or right along the floor
 *   IDLE     — standing still (random breaks while walking)
 *   DRAGGED  — user is holding the character
 *   THROWN   — released mid-air with velocity
 *
 * State transitions:
 *
 *   FALLING (body.onGround)> LANDING
 *   LANDING (timer expires) > WALKING
 *   WALKING (hit wall) > WALKING (change direction)
 *   WALKING (random chance) > IDLE
 *   IDLE (timer expires) > WALKING
 *   any (mousedown on sprite) > DRAGGED
 *   DRAGGED (mouseup, no velocity) > FALLING
 *   DRAGGED (mouseup, has velocity) > THROWN
 *   THROWN (body.onGround && !body.thrown) > WALKING
 */

var PZStateMachine = (function () {

  var STATES = {
    FALLING    : 'FALLING',
    LANDING    : 'LANDING',
    WALKING    : 'WALKING',
    IDLE       : 'IDLE',
    DRAGGED    : 'DRAGGED',
    THROWN     : 'THROWN',
    MOUSE_GRAB : 'MOUSE_GRAB',
  };

  var DIR = { LEFT: -1, RIGHT: 1 };

  // Duration constants (milliseconds)
  var LANDING_DURATION_MS = 180;
  var IDLE_MIN_MS         = 1600;
  var IDLE_RANGE_MS       = 5000;

  // Probability per frame of spontaneously going idle (~60fps → ~0.25% = ~1x per 4s)
  var IDLE_CHANCE_PER_FRAME = 0.0025;

  var MOUSE_GRAB_DURATION_MS   = 5000;
  // JUMP FREQUENCY — anteater decides to grab cursor (from WALKING or IDLE)
  // MOUSE_GRAB_CHANCE_PER_FRAME: per-frame probability at ~60fps
  // 0.0002 ≈ 1x per 80s | 0.0005 ≈ 1x per 33s | 0.001 ≈ 1x per 17s
  var MOUSE_GRAB_CHANCE_PER_FRAME = 0.0002;

  function StateMachine() {
    this.state     = STATES.FALLING;
    this.direction = DIR.RIGHT;

    this._timer    = 0;    // ms elapsed in current timed state
    this._duration = null; // ms to spend before auto-transitioning

    // onChange callbacks: (oldState, newState, direction)
    this._listeners = [];
  }

  StateMachine.prototype.onChange = function (fn) {
    this._listeners.push(fn);
    return this; 
  };

  StateMachine.prototype._fire = function (oldState) {
    var self = this;
    this._listeners.forEach(function (fn) {
      fn(oldState, self.state, self.direction);
    });
  };

  StateMachine.prototype._go = function (newState, opts) {
    var old = this.state;
    if (old === newState && !(opts && opts.force)) return;

    this.state  = newState;
    this._timer = 0;

    if (newState === STATES.LANDING) {
      this._duration = LANDING_DURATION_MS;
    } else if (newState === STATES.IDLE) {
      this._duration = IDLE_MIN_MS + Math.random() * IDLE_RANGE_MS;
    } else if (newState === STATES.MOUSE_GRAB) {
      this._duration = MOUSE_GRAB_DURATION_MS;
    } else {
      this._duration = null;
    }

    this._fire(old);
  };

  /**
   * dt   — milliseconds since last frame
   * body — PhysicsBody from physics.js
   */
  StateMachine.prototype.update = function (dt, body) {
    this._timer += dt;
    var vw = window.innerWidth;

    switch (this.state) {
      case STATES.FALLING:
        if (body.onGround) {
          this._go(STATES.LANDING);
        }
        break;

      case STATES.LANDING:
        if (this._timer >= this._duration) {
          this.direction = Math.random() > 0.5 ? DIR.RIGHT : DIR.LEFT;
          this._go(STATES.WALKING);
        }
        break;

      case STATES.WALKING:
        // Wall flip
        if (this.direction === DIR.LEFT && body.x <= 0) {
          this.direction = DIR.RIGHT;
        } else if (this.direction === DIR.RIGHT && body.x + body.w >= vw) {
          this.direction = DIR.LEFT;
        }
        // Spontaneous idle
        if (Math.random() < IDLE_CHANCE_PER_FRAME) {
          this._go(STATES.IDLE);
        }
        // Mouse grab prank (can only start from ground)
        if (body.onGround && Math.random() < MOUSE_GRAB_CHANCE_PER_FRAME) {
          this._go(STATES.MOUSE_GRAB);
        }
        break;

      case STATES.IDLE:
        if (this._timer >= this._duration) {
          this.direction = Math.random() > 0.5 ? DIR.RIGHT : DIR.LEFT;
          this._go(STATES.WALKING);
        }
        // Mouse grab prank
        if (Math.random() < MOUSE_GRAB_CHANCE_PER_FRAME) {
          this._go(STATES.MOUSE_GRAB);
        }
        break;

      case STATES.MOUSE_GRAB:
        if (this._timer >= this._duration) {
          this.direction = Math.random() > 0.5 ? DIR.RIGHT : DIR.LEFT;
          this._go(STATES.WALKING);
        }
        break;

      case STATES.DRAGGED:
        // Transitions driven externally by drag controller
        break;

      case STATES.THROWN:
        if (body.onGround && !body.thrown) {
          this.direction = Math.random() > 0.5 ? DIR.RIGHT : DIR.LEFT;
          this._go(STATES.WALKING);
        }
        break;
    }
  };

  // External triggers (called by drag controller)
  StateMachine.prototype.startDrag = function () {
    this._go(STATES.DRAGGED);
  };

  StateMachine.prototype.endDrag = function (hasVelocity) {
    this._go(hasVelocity ? STATES.THROWN : STATES.FALLING);
  };

  return { StateMachine: StateMachine, STATES: STATES, DIR: DIR };
})();
