/*
*TUNING CONSTANTS:
 *   GRAVITY          acceleration per frame (px/frame²)
 *   TERMINAL_VEL     max fall speed
 *   WALK_SPEED       horizontal walk speed
 *   FRICTION         velocity damping when landing after a throw
 *   THROW_AIR_DAMP   velocity multiplier per frame while airborne after throw
 *   MAX_THROW_SPEED  caps release velocity so it doesn't fly off screen
 *   BOUNCE_FACTOR    how much vertical velocity bounces off floor (0 = no bounce)
 */

var PZPhysics = (function () {
  var GRAVITY         = 0.16;
  var TERMINAL_VEL    = 14;
  var FLOOR_OFFSET    = 25; // px above bottom (set small value if clipping into taskbar)
  var WALK_SPEED         = 0.375; // was 0.5; reduced by 1/4
  var MOUSE_GRAB_RUN_SPEED = 3.0;  // 2.5x faster (was 1.2); px/frame at 60fps
  var MOUSE_GRAB_JUMP_SPEED = 14;  // velocity magnitude toward cursor (px/frame)
  var FRICTION        = 0.80;
  var THROW_AIR_DAMP  = 0.97;
  var MAX_THROW_SPEED = 22;
  var BOUNCE_FACTOR   = 0.28;
  var BOUNCE_STOP     = 1.2; // vy below this → stop bouncing

  /**
   * PhysicsBody
   * Tracks position, velocity, and flags for one mascot instance.
   */

  function PhysicsBody(x, y, w, h) {
    this.x        = x;
    this.y        = y;
    this.vx       = 0;
    this.vy       = 0;
    this.w        = w || 64;
    this.h        = h || 64;
    this.onGround = false;
    this.thrown   = false;
  }

  /**
   * step(body, viewportW, viewportH, state)
   *
   * Advance physics by one frame.
   * Does NOT mutate velocity for WALKING — the state machine does that.
   * Does NOT mutate anything while DRAGGED.
   */
  PhysicsBody.prototype.step = function (viewportW, viewportH, isDragging, dt) {
    if (isDragging) return this;

    // Normalize to 60fps so physics speed is consistent regardless of frame rate
    var scale = dt ? Math.min(dt / 16.667, 3) : 1;

    // Gravity
    if (!this.onGround) {
      this.vy = Math.min(this.vy + GRAVITY * scale, TERMINAL_VEL);
    }

    // Air damping when thrown (pow ensures consistent damping across frame rates)
    if (this.thrown) {
      var damp = Math.pow(THROW_AIR_DAMP, scale);
      this.vx *= damp;
      this.vy *= damp;
    }

    this.x += this.vx * scale;
    this.y += this.vy * scale;

    // Collision
    var floorY = viewportH - this.h - FLOOR_OFFSET;

    // Floor
    if (this.y >= floorY) {
      this.y = floorY;
      if (this.thrown) {
        var bounced = -this.vy * BOUNCE_FACTOR;
        if (Math.abs(bounced) < BOUNCE_STOP) {
          this.vy = 0;
          this.thrown = false;
        } else {
          this.vy = bounced;
        }
        this.vx *= FRICTION;
      } else {
        this.vy = 0;
      }
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // Left wall
    if (this.x < 0) {
      this.x = 0;
      if (this.thrown) this.vx = Math.abs(this.vx) * 0.5;
    }

    // Right wall
    if (this.x + this.w > viewportW) {
      this.x = viewportW - this.w;
      if (this.thrown) this.vx = -Math.abs(this.vx) * 0.5;
    }

    // Ceiling
    if (this.y < 0) {
      this.y = 0;
      if (this.vy < 0) this.vy = Math.abs(this.vy) * 0.3;
    }

    return this;
  };

  /**
   * applyWalkVelocity(body, direction)
   * Sets vx for walking. direction: 1 = right, -1 = left.
   */
  PhysicsBody.prototype.applyWalkVelocity = function (direction) {
    this.vx = WALK_SPEED * direction;
    this.vy = 0;
  };

  /**
   * applyThrow(body, vx, vy)
   * Launches the body with the given velocity (from drag release).
   */
  PhysicsBody.prototype.applyThrow = function (vx, vy) {
    this.vx = Math.max(-MAX_THROW_SPEED, Math.min(MAX_THROW_SPEED, vx));
    this.vy = Math.max(-MAX_THROW_SPEED, Math.min(MAX_THROW_SPEED, vy));
    this.thrown   = true;
    this.onGround = false;
  };

  return { PhysicsBody: PhysicsBody, GRAVITY: GRAVITY, MOUSE_GRAB_RUN_SPEED: MOUSE_GRAB_RUN_SPEED, MOUSE_GRAB_JUMP_SPEED: MOUSE_GRAB_JUMP_SPEED, FLOOR_OFFSET: FLOOR_OFFSET };
})();
