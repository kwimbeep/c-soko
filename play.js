/*********************************
 C-Soko - play.js (2013)
 Author: MB
 Mail: mb13@mail.lv
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

function Play(game) {
  this.game = game;
  this.returnScreen = this.game.SCREENS.PLAY;
  this.controls = new Controls();
  this.pMove = false;
}

Play.prototype.loop = function() {
  this.handleEvents();
  this.update();
  this.render();
  return this.returnScreen;
};

Play.prototype.handleEvents = function() {
  var event = null;
  var handled = false;
  var map = this.game.map;
  var player = map.player;
  while (event = this.game.inputManager.getEvent()) {
    switch (event.type) {
      case 'keyDown':
        switch (event.key) {
          case this.game.KEYS.Q:
          case this.game.KEYS.U:
          case this.game.KEYS.Z:
            if (map.eventLocks) { return; }
            if (!map.completed) { map.undo(); }
            handled = true; break;
          case this.game.KEYS.PAGEDOWN:
            map.loadPrevLevel();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            handled = true; break;
          case this.game.KEYS.F:
          case this.game.KEYS.ENTER:
          case this.game.KEYS.SPACE:
          case this.game.KEYS.PAGEUP:
            if (map.completed || event.key === this.game.KEYS.PAGEUP) {
              map.loadNextLevel();
              this.game.inputManager.resetKeys();
              this.game.inputManager.resetPointer();
            }
            handled = true; break;
        }
        break;
      case 'keyUp':
        switch (event.key) {
          case this.game.KEYS.ESC:
            this.returnScreen = this.game.SCREENS.MENU;
            handled = true; break;
          case this.game.KEYS.R:
            map.restartLevel();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            handled = true; break;
        }
        break;
      case 'pointerDown':
        var button = this.controls.clickable.check(event.x, event.y, true, false);
        switch (button) {
          case 'undo':
            if (map.eventLocks) { return; }
            if (!map.completed) { map.undo(); }
            handled = true; break;
        }
        break;
      case 'pointerUp':
        var button = this.controls.clickable.check(event.x, event.y, false, false);
        if (!this.pMove && !button && map.completed) {
          map.loadNextLevel();
          this.game.inputManager.resetKeys();
          this.game.inputManager.resetPointer();
          handled = true; break;
        } else { this.pMove = false; }
        switch (button) {
          case 'title':
            this.returnScreen = this.game.SCREENS.MENU;
            handled = true; break;
          case 'prev':
            map.loadPrevLevel();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            handled = true; break;
          case 'restart':
            map.restartLevel();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            handled = true; break;
          case 'next':
            map.loadNextLevel();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            handled = true; break;
        }
        break;
    }
  }
  if (handled || map.completed || map.eventLocks) return;
  if (this.game.inputManager.pointer.down) {
    var direction = map.checkPointer(this.game.inputManager.pointer.x, this.game.inputManager.pointer.y);
    var tX = player.x + direction.x;
    var tY = player.y + direction.y;
    if ((tX != player.x) || (tY != player.y)) { if (player.checkMove(tX, tY)) { this.pMove = true; } }
  }
  for (var p in this.game.inputManager.keys) {
    if (map.eventLocks) { return; }
    if (this.game.inputManager.keys[p]) {
      var tX = player.x;
      var tY = player.y;
      switch (parseInt(p, 10)) {
        case this.game.KEYS.A:
        case this.game.KEYS.LEFT:
          tX--; break;
        case this.game.KEYS.D:
        case this.game.KEYS.RIGHT:
          tX++; break;
        case this.game.KEYS.W:
        case this.game.KEYS.UP:
          tY--; break;
        case this.game.KEYS.S:
        case this.game.KEYS.DOWN:
          tY++; break;
      }
      if ((tX != player.x) || (tY != player.y)) { player.checkMove(tX, tY); }
    }
  }
};

Play.prototype.update = function() {
  this.game.map.update(this.game.frameTime);
};

Play.prototype.render = function() {
  var ctx = this.game.ctx;
  this.renderBG(ctx);
  this.controls.render(ctx);
  this.game.map.render(ctx);
};

Play.prototype.renderBG = function(ctx) {
  ctx.fillStyle = this.game.map.colors.bg;
  ctx.fillRect(0, 0, this.game.WIDTH, this.game.HEIGHT);
};