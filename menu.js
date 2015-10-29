/*********************************
 C-Soko - menu.js (2013)
 Author: MB
 Mail: mb13@mail.lv
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

function Menu(game) {
  this.game = game;
  this.returnScreen = this.game.SCREENS.MENU;
  this.menu = new TitleMenu();
  this.info = new TitleInfo(this.game.map.stats);
  this.tSize = 0;
  this.colorPool = [];
  this.colorPool.push({ bg: 'hsla(0, 7%, 92%, 1)', line1: 'hsla(217, 20%, 70%, 1)', line2: 'hsla(13, 71%, 80%, 1)' });
  this.colorPool.push({ bg: 'hsla(37, 14%, 89%, 1)', line1: 'hsla(265, 16%, 74%, 1)', line2: 'hsla(134, 25%, 75%, 1)' });
  this.colorPool.push({ bg: 'hsla(37, 20%, 90%, 1)', line1: 'hsla(68, 12%, 65%, 1)', line2: 'hsla(161, 15%, 69%, 1)' });
  var i = getRandomInt(0, this.colorPool.length - 1);
  this.colors = this.colorPool[i];
  this.justLoaded = true;
  this.drawLevel = false;
}

Menu.prototype.loop = function() {
  this.update();
  this.render();
  return this.returnScreen;
};

Menu.prototype.update = function() {
  var event = null;
  var map = this.game.map;
  if (!map.loaded) { return; }
  if (map.loaded && this.justLoaded) {
    this.setPreviewSize();
    this.justLoaded = false;
    this.drawLevel = true;
  }
  while (event = this.game.inputManager.getEvent()) {
    switch (event.type) {
      case 'keyDown':
        switch (event.key) {
          case this.game.KEYS.A:
          case this.game.KEYS.PAGEDOWN:
          case this.game.KEYS.LEFT:
            map.loadPrevLevel();
            this.setPreviewSize();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
          case this.game.KEYS.D:
          case this.game.KEYS.PAGEUP:
          case this.game.KEYS.RIGHT:
            map.loadNextLevel();
            this.setPreviewSize();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
        }
        break;
      case 'keyUp':
        switch (event.key) {
          case this.game.KEYS.DELETE:
            localStorage.clear();
            this.game.loadCollection();
            this.justLoaded = true;
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
          case this.game.KEYS.F:
          case this.game.KEYS.ENTER:
          case this.game.KEYS.SPACE:
            map.tileSize = this.tSize;
            this.drawLevel = false;
            this.returnScreen = this.game.SCREENS.PLAY;
            break;
          case this.game.KEYS.W:
          case this.game.KEYS.UP:
            this.game.loadNextCollection();
            this.justLoaded = true;
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
          case this.game.KEYS.S:
          case this.game.KEYS.DOWN:
            this.game.loadPrevCollection();
            this.justLoaded = true;
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
        }
        break;
      case 'pointerDown':
        var button = this.menu.clickable.check(event.x, event.y, true, false);
        break;
      case 'pointerUp':
        var button = this.menu.clickable.check(event.x, event.y, false, false);
        switch (button) {
          case 'play':
            map.tileSize = this.tSize;
            this.drawLevel = false;
            this.returnScreen = this.game.SCREENS.PLAY;
            break;
          case 'prevCollection':
            this.game.loadPrevCollection();
            this.justLoaded = true;
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
          case 'nextCollection':
            this.game.loadNextCollection();
            this.justLoaded = true;
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
          case 'prevLevel':
            map.loadPrevLevel();
            this.setPreviewSize();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
          case 'nextLevel':
            map.loadNextLevel();
            this.setPreviewSize();
            this.game.inputManager.resetKeys();
            this.game.inputManager.resetPointer();
            break;
        }
        break;
    }
  }
};

Menu.prototype.setPreviewSize = function() {
  this.tSize = this.game.map.tileSize;
  this.game.map.tileSize = 10;
};

Menu.prototype.render = function() {
  var ctx = this.game.ctx;
  ctx.save();
  this.renderBG(ctx);
  this.renderTitle(ctx);
  if (this.drawLevel) {
    ctx.globalAlpha = 0.5;
    this.game.map.renderSimple(ctx, 20, 100, true);
    ctx.globalAlpha = 1;
    this.info.render(ctx);
  }
  this.menu.render(ctx);
  this.renderFooter(ctx);
  ctx.restore();
};

Menu.prototype.renderBG = function(ctx) {
  ctx.fillStyle = this.colors.bg;
  ctx.fillRect(0, 0, this.game.WIDTH, this.game.HEIGHT);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.strokeStyle = this.colors.line1;
  ctx.moveTo(10, 420);
  ctx.lineTo(this.game.WIDTH - 10, 420);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = this.colors.line2;
  ctx.moveTo(270, 410);
  ctx.lineTo(this.game.WIDTH - 10, 410);
  ctx.stroke();
};

Menu.prototype.renderTitle = function(ctx) {
  ctx.font = '66px csfont';
  ctx.fillStyle = 'hsla(0, 0%, 60%, 1)';
  ctx.fillText('C-Soko', 20, 20);
};

Menu.prototype.renderFooter = function(ctx) {
  ctx.font = '16px csfont';
  ctx.textAlign = 'end';
  ctx.fillStyle = 'hsla(0, 0%, 70%, 1)';
  ctx.fillText('C-Soko: 2013 - Marcis Berzins - mb13@inbox.lv', 780, 450);
  ctx.font = '12px csfont';
  ctx.fillText('Sokoban: 1981 - Hiroyuki Imabayashi - http://sokoban.jp/', 780, 470);
  ctx.fillText('Telegrama Font: 2011 - YOFonts - http://www.yoworks.com/', 780, 490);
};