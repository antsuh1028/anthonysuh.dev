/**
 * WHEN SPRITE SHEET IS DONE:
 *   1. Put it at:  anteaterchar/assets/anteater.png  (ext root)
 *   2. Set SPRITE_URL below using the URL passed in from the content script
 *   3. Fill in the FRAMES map with { x, y } pixel offsets into the sheet (if one sheet, unless we do straight images?)
 *   4. Remove the placeholder emoji/color logic
 *
 * sprite sheet convention (based on shimeji)
 *   Each tile = TILE_SIZE × TILE_SIZE px (default 64)
 *   Row 0: Fall    (2 frames)
 *   Row 1: Land    (1 frame)
 *   Row 2: Walk    (4 frames — right-facing; left handled by CSS scaleX(-1))
 *   Row 3: Idle    (2 frames)
 *   Row 4: Dragged (1 frame)
 *   Row 5: Thrown  (1 frame)
 */


var PZSprite = (function () {

  var TILE = 88; // px per sprite tile

  // Map state name → array of { x, y } frame offsets in the sprite sheet
  //lined up for clarity
  var FRAMES = {
    FALLING : [{ x: 0,        y: 0 },        { x: TILE,     y: 0 }],
    LANDING : [{ x: TILE * 2, y: 0 }],
    WALKING : [{ x: 0,        y: TILE },     { x: TILE, y: TILE },
               { x: TILE * 2, y: TILE },     { x: TILE * 3, y: TILE }],
    IDLE    : [{ x: 0,        y: TILE * 2 }, { x: TILE, y: TILE * 2 }],
    DRAGGED : [{ x: 0,        y: TILE * 3 }],
    THROWN  : [{ x: TILE,     y: TILE * 3 }],
  };

  var FRAME_MS = {
    FALLING : 130,
    LANDING : 180,
    WALKING : 110,
    IDLE    : 450,
    DRAGGED : 999,
    THROWN  : 999,
  };

  var ASSETS = 'dist/';

  //FIXME: remove when using real sprite sheet
  var PLACEHOLDER = {
    FALLING : { image: ASSETS + 'Falling rotate -45 degree.png' },
    LANDING : { image: ASSETS + 'Plop.png' },
    WALKING : {
      walkLeft  : ASSETS + 'WALK LEFT.png',
      walkRight : ASSETS + 'WALK RIGHT.png',
    },
    IDLE    : { image: ASSETS + 'Idle State.png' },
    DRAGGED : {
      dragImages: {
        grab  : ASSETS + 'Grab State.png',
        left  : ASSETS + 'Drag Left.png',
        right : ASSETS + 'Drag Right.png',
      },
    },
    THROWN  : {
      throwImages: {
        left  : ASSETS + 'Drag Left.png',
        right : ASSETS + 'Drag Right.png',
      },
    },
  };

  function Sprite(spriteUrl) {
    this.el         = null;
    this._spriteUrl = spriteUrl || null; // null = use placeholder
    this._frame     = 0;
    this._frameMsElapsed = 0;
    this._lastState = null;
    this._hatEl     = null;
    this._contentEl = null; // emoji/placeholder text — separate from _hatEl so we never wipe it
    this._lastBgUrl = null; // track last set backgroundImage to skip redundant assignments
  }
  
  function resolveAssetPath(p) {
    if (!p) return p;
    if (/^(?:https?:|data:|chrome-extension:)/i.test(p)) return p;
    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
      try {
        var url = chrome.runtime.getURL(p);
        return url;
      } catch (e) { /* fallthrough */ }
    }
    try { return new URL(p, location.href).href; } catch (e) { return p; }
  }

  Sprite.prototype.mount = function () {
    if (this.el) return;

    var el = document.createElement('div');
    el.id = 'pocketzot-mascot';

    Object.assign(el.style, {
      position      : 'fixed',
      left          : '0',
      top           : '0',
      zIndex        : '2147483647',
      width         : TILE + 'px',
      height        : TILE + 'px',
      pointerEvents : 'auto',
      cursor        : 'grab',
      userSelect    : 'none',
      overflow      : 'visible',
      borderRadius  : '0',
      border        : 'none',
      outline       : 'none',
      boxShadow     : 'none',
      display       : 'flex',
      alignItems    : 'center',
      justifyContent: 'center',
      fontSize      : '32px',
      backgroundColor: 'transparent',
      willChange    : 'transform', // GPU compositing hint — transform only, no layout props
    });

    if (this._spriteUrl) {
      el.style.backgroundImage  = 'url(' + this._spriteUrl + ')';
      el.style.backgroundRepeat = 'no-repeat';
    }

    // Content span for emoji fallback — must NOT use el.textContent or it wipes _hatEl
    this._contentEl = document.createElement('span');
    this._contentEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;';
    el.appendChild(this._contentEl);

    this._hatEl = document.createElement('div');
    this._hatEl.id = 'pocketzot-hat';
    this._hatEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;display:flex;align-items:flex-start;justify-content:center;z-index:999999;';
    el.appendChild(this._hatEl);

    this.el = el;
    document.body.appendChild(el);

    // Preload all placeholder images so there's no white flash on first use
    var allImgs = [
      PLACEHOLDER.FALLING.image,
      PLACEHOLDER.LANDING.image,
      PLACEHOLDER.WALKING.walkLeft,
      PLACEHOLDER.WALKING.walkRight,
      PLACEHOLDER.IDLE.image,
      PLACEHOLDER.DRAGGED.dragImages.grab,
      PLACEHOLDER.DRAGGED.dragImages.left,
      PLACEHOLDER.DRAGGED.dragImages.right,
      PLACEHOLDER.THROWN.throwImages.left,
      PLACEHOLDER.THROWN.throwImages.right,
    ];
    for (var i = 0; i < allImgs.length; i++) {
      if (allImgs[i]) {
        var preload = new Image();
        preload.src = resolveAssetPath(allImgs[i]);
      }
    }

    // Load current hat from storage on mount
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      var self = this;
      chrome.storage.local.get('pocketzot_equipped_hat', function (data) {
        var hat = data && data.pocketzot_equipped_hat;
        self.setEquippedHat(hat);
      });
    }
  };

  /**
   * setEquippedHat(hat) — hat is { image_url, name } or null
   * Updates the hat overlay synchronously. Called by content script when HAT_EQUIPPED message arrives.
   */
  Sprite.prototype.setEquippedHat = function (hat) {
    if (!this._hatEl) return;
    this._hatEl.innerHTML = '';
    if (hat && hat.image_url) {
      var img = document.createElement('img');
      img.src = resolveAssetPath(hat.image_url);
      var isMerrier = hat.name && String(hat.name).toLowerCase().indexOf('merrier') >= 0;
      var extra = isMerrier ? 'margin-top:5px;transform:scaleX(-1);' : 'margin-top:-15px;';
      img.style.cssText = 'max-width:140%;max-height:85px;object-fit:contain;transform-origin:bottom center;' + extra;
      img.alt = hat.name || 'hat';
      this._hatEl.appendChild(img);
    }
  };

  Sprite.prototype.unmount = function () {
    if (this._hatEl) this._hatEl.innerHTML = '';
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
    this._hatEl = null;
  };

  /**
   * update(x, y, state, direction, dt, body)
   * Called every animation frame. body optional (for THROWN velocity/rotation).
   */
  Sprite.prototype.update = function (x, y, state, direction, dt, body) {
    if (!this.el) return;

    // Position via transform: translate3d — GPU-composited, no layout reflow
    var tx = Math.round(x);
    var ty = Math.round(y);
    var pos = 'translate3d(' + tx + 'px,' + ty + 'px,0)';

    if (state === 'DRAGGED' || state === 'FALLING') {
      this.el.style.transform = pos;
    } else if (state === 'THROWN' && body) {
      var vx = body.vx || 0;
      var vy = body.vy || 0;
      var angleDeg = Math.atan2(vy, vx) * (180 / Math.PI);
      this.el.style.transform = pos + ' rotate(' + angleDeg + 'deg)';
    } else {
      // Images face left; walking right needs scaleX(-1) to face right
      this.el.style.transform = pos + (direction > 0 ? ' scaleX(-1)' : '');
    }

    if (this._spriteUrl) {
      this._advanceFrame(state, dt);
    } else {
      if (state === 'WALKING' || state === 'MOUSE_GRAB') {
        this._walkFootMsElapsed = (this._walkFootMsElapsed || 0) + dt;
        if (this._walkFootMsElapsed >= 500) {
          this._walkFootMsElapsed = 0;
          this._walkFoot = (this._walkFoot === 0 ? 1 : 0);
        }
        if (this._walkFoot === undefined) this._walkFoot = 0;
      } else {
        this._walkFootMsElapsed = 0;
        this._walkFoot = 0;
      }
      this._renderPlaceholder(state, direction, body);
    }
  };

  Sprite.prototype._renderPlaceholder = function (state, direction, body) {
    var p = PLACEHOLDER[state] || (state === 'MOUSE_GRAB' ? PLACEHOLDER.WALKING : null) || PLACEHOLDER.IDLE;
    // no background color — show PNG transparency
    this.el.style.backgroundColor = 'transparent';

    // DRAGGED: pick image by movement direction (no transform; images already oriented)
    // THROWN: pick image by throw direction (vx)
    // WALKING: alternate walk left / walk right every 500ms (foot forward); transform flips for right direction
    var img = p.image;
    if ((state === 'WALKING' || state === 'MOUSE_GRAB') && p && p.walkLeft && p.walkRight) {
      img = this._walkFoot ? p.walkRight : p.walkLeft;
    } else if (state === 'DRAGGED' && p.dragImages) {
      img = direction > 0 ? p.dragImages.right : (direction < 0 ? p.dragImages.left : p.dragImages.grab);
    } else if (state === 'THROWN' && p.throwImages && body) {
      var vx = body.vx || 0;
      img = vx >= 0 ? p.throwImages.right : p.throwImages.left;
    }

    if (img) {
      var url = resolveAssetPath(img);
      if (url !== this._lastBgUrl) {
        this._lastBgUrl = url;
        this.el.style.backgroundImage = 'url("' + url + '")';
        this.el.style.backgroundRepeat = 'no-repeat';
        this.el.style.backgroundPosition = 'center';
        this.el.style.backgroundSize = 'contain';
      }
      this._contentEl.textContent = '';
    } else {
      if (this._lastBgUrl !== 'none') {
        this._lastBgUrl = 'none';
        this.el.style.backgroundImage = 'none';
      }
      this._contentEl.textContent = p.emoji || '';
    }
  };

  Sprite.prototype._advanceFrame = function (state, dt) {
    var frames = FRAMES[state] || FRAMES.IDLE;
    var dur    = FRAME_MS[state] || 200;

    // Reset when state changes
    if (state !== this._lastState) {
      this._lastState       = state;
      this._frame           = 0;
      this._frameMsElapsed  = 0;
    }

    this._frameMsElapsed += dt;
    if (this._frameMsElapsed >= dur) {
      this._frameMsElapsed = 0;
      this._frame = (this._frame + 1) % frames.length;
    }

    var f = frames[this._frame];
    this.el.style.backgroundPosition = '-' + f.x + 'px -' + f.y + 'px';
  };

  return { Sprite: Sprite };
})();

