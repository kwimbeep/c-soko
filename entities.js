/*********************************
 C-Soko - entities.js (2016)
 Author: Marcis Berzins
 Mail: berzins.marcis@gmail.com
 This program is licensed under the terms of the GNU General Public License: http://www.gnu.org/licenses/gpl-3.0.txt
 *********************************/

//----------------- Map -------------------//

function Map(fName) {
  this.left = 10; this.top = 35;
  this.lLeft = 0; this.lTop = 0;
  this.width = 780; this.height = 410;
  this.lWidth = 0; this.lHeight = 0;
  this.tileSizes = [50, 40, 30, 20, 10, 5];
  this.tileSize = this.tileSizes[0];
  this.shadowScaleFactor = 1;
  this.colorPool = [];
  this.colorPool.push({ bg: 'hsla(272, 37%, 92%, 1)', border: 'hsla(250, 43%, 83%, 1)', wall: 'hsla(24, 21%, 55%, 1)', box: 'hsla(187, 76%, 59%, 0.5)', player: 'hsla(55, 25%, 30%, 0.5)' });
  this.colorPool.push({ bg: 'hsla(40, 32%, 85%, 1)', border: 'hsla(195, 18%, 53%, 0.3)', wall: 'hsla(195, 18%, 53%, 1)', box: 'hsla(40, 32%, 85%, 0.5)', player: 'hsla(61, 49%, 23%, 0.5)' });
  this.colorPool.push({ bg: 'hsla(42, 47%, 85%, 1)', border: 'hsla(23, 24%, 76%, 1)', wall: 'hsla(10, 40%, 57%, 0.8)', box: 'hsla(36, 61%, 82%, 0.7)', player: 'hsla(171, 26%, 39%, 0.7)' });
  this.colorPool.push({ bg: 'hsla(53, 21%, 93%, 1)', border: 'hsla(337, 50%, 86%, 1)', wall: 'hsla(356, 18%, 64%, 1)', box: 'hsla(124, 26%, 88%, 0.7)', player: 'hsla(337, 50%, 86%, 0.7)' });
  this.colorPool.push({ bg: 'hsla(0, 0%, 90%, 1)', border: 'hsla(0, 76%, 87%, 0.5)', wall: 'hsla(238, 31%, 60%, 1)', box: 'hsla(202, 51%, 70%, 0.5)', player: 'hsla(299, 25%, 48%, 0.7)' });
  this.colorPool.push({ bg: 'hsla(30, 5%, 93%, 1)', border: 'hsla(30, 5%, 79%, 1)', wall: 'hsla(349, 24%, 70%, 1)', box: 'hsla(320, 3%, 46%, 0.4)', player: 'hsla(189, 43%, 48%, 0.8)' });
  this.colors = this.colorPool[0];
  this.collection = [];
  this.level = [];
  this.boxes = [];
  this.undoPool = [];
  this.eventLocks = 0;
  this.boxMoved = false;
  this.completed = false;
  this.loaded = false;
  this.player = new Player(this);
  this.stats = new Stats(this);
  this.loadCollection(fName);
}

Map.prototype.update = function(fTime) {
  for (var i = 0; i < this.boxes.length; i++) { this.boxes[i].update(fTime); }
  this.player.update(fTime);
  if (this.boxMoved) {
    if (this.checkCompleted()) {
      this.completed = true;
      var s = this.stats.levelStats;
      if (!s.bestMoves && !s.bestPushes) { this.stats.collectionStats.completed++; }
      if ((!s.bestMoves && !s.bestPushes) || ((s.moves + s.pushes) < (s.bestMoves + s.bestPushes))) { s.bestMoves = s.moves; s.bestPushes = s.pushes; }
      this.stats.saveLocalData();
    }
    this.boxMoved = false;
  }
};

Map.prototype.render = function(ctx) {
  this.stats.render(ctx);
  ctx.strokeStyle = this.colors.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(this.left, this.top, this.width, this.height);
  if (this.tileSize < 20) { this.renderSimple(ctx, this.lLeft, this.lTop, this.tileSize); return; }
  for (var i = 0; i < this.level.length; i++) {
    for (var j = 0; j < this.level[i].length; j++) {
      var tX = this.lLeft + (this.tileSize * j); var tY = this.lTop + (this.tileSize * i);
      this.level[i][j].render(ctx, tX, tY);
    }
  }
  for (var i = 0; i < this.boxes.length; i++) { this.boxes[i].render(ctx); }
  this.player.render(ctx);
};

Map.prototype.renderSimple = function(ctx, l, t, s, calculateLocally) {
  if (calculateLocally === undefined) calculateLocally = false;
  var tX, tY, tR;
  for (var i = 0; i < this.level.length; i++) {
    for (var j = 0; j < this.level[i].length; j++) {
      tX = l + (s * j); tY = t + (s * i);
      if (this.level[i][j]) {
        switch (this.level[i][j].constructor) {
          case Wall: ctx.fillStyle = 'hsla(0, 0%, 30%, 1)'; ctx.fillRect(tX, tY, s, s); break;
          case Floor: ctx.fillStyle = 'hsla(0, 0%, 100%, 1)'; ctx.fillRect(tX, tY, s, s); break;
          case Goal:
            ctx.fillStyle = 'hsla(0, 0%, 100%, 1)'; ctx.fillRect(tX, tY, s, s);
            ctx.fillStyle = 'hsla(0, 0%, 30%, 1)';
            tX = Math.round(tX + (s / 2)); tY = Math.round(tY + (s / 2)); tR = Math.round(s / 4);
            ctx.beginPath(); ctx.arc(tX, tY, tR, 0, (2 * Math.PI)); ctx.fill();
            break;
        }
      }
    }
  }
  ctx.fillStyle = 'hsla(0, 0%, 40%, 0.5)';
  for (var i = 0; i < this.boxes.length; i++) {
    tX = (calculateLocally) ? l + (s * this.boxes[i].x) : this.boxes[i].xPx;
    tY = (calculateLocally) ? t + (s * this.boxes[i].y) : this.boxes[i].yPx;
    ctx.fillRect(tX, tY, s, s);
  }
  ctx.fillStyle = 'hsla(0, 0%, 0%, 0.5)';
  tX = (calculateLocally) ? l + (s * this.player.x) : this.player.xPx;
  tY = (calculateLocally) ? t + (s * this.player.y) : this.player.yPx;
  ctx.fillRect(tX, tY, s, s);
};

Map.prototype.loadCollection = function(fName) {
  this.loaded = false;
  var that = this;
  get('levels/' + fName, function(d) {
    if ((d.status != 200) && (d.status != 0)) { alert('Error loading collection!'); return; }
    that.collection.length = 0;
    that.stats.resetCollection();
    var collectionText = d.responseText.replace(/(\r\n|\r)/g,'\n');
    var collectionArray = collectionText.split(';');
    for (var i = 1; i < collectionArray.length; i++) {
      if (collectionArray[i].indexOf('#') > -1) {
        that.collection.push(collectionArray[i]);
      }
    }
    that.stats.setCollectionInfo(fName, collectionArray[0], that.collection.length);
    var nr = localData(fName + ':currentLevel');
    nr = (nr < that.collection.length) ? nr : 0;
    that.loadLevel(nr);
  });
};

Map.prototype.loadLevel = function(level) {
  this.level.length = 0;
  this.boxes.length = 0;
  this.undoPool.length = 0;
  this.loaded = false;
  this.boxMoved = false;
  this.completed = false;
  this.stats.resetLevel();
  this.player.reset();
  var i = getRandomInt(0, this.colorPool.length - 1);
  this.colors = this.colorPool[i];
  var levelText = this.collection[level];
  var levelArray = levelText.split('\n');
  var sizeInTiles = {w: 0, h: 0};
  for (var i = 1; i < levelArray.length; i++) {
    var isLevelRow = levelArray[i].indexOf('#') !== -1;
    if (!isLevelRow) { continue; }
    this.level.push([]);
    var rowIndex = this.level.length - 1;
    if (rowIndex + 1 > sizeInTiles.h) { sizeInTiles.h = rowIndex + 1; }
    var wallPlaced = false;
    var levelRowArray = levelArray[i].split('');
    for (var j = 0; j < levelRowArray.length; j++) {
      switch (levelRowArray[j]) {
        case ' ': // empty space
        case '$': // box
        case '@': // player
          this.level[rowIndex][j] = (wallPlaced) ? new Floor(this) : new Empty();
          break;
        case '*': // box on goal
        case '.': // goal
        case '+': // player on goal
          this.level[rowIndex][j] = new Goal(this);
          break;
        case '#': // wall
          this.level[rowIndex][j] = new Wall(this);
          wallPlaced = true;
          break;
      }
      switch (levelRowArray[j]) {
        case '$': // box
        case '*': // box on goal
          this.boxes.push(new Box(this, j, rowIndex));
          break;
        case '@': // player
        case '+': // player on goal
          this.player.setCoords(j, rowIndex);
          break;
      }
      if (j + 1 > sizeInTiles.w) { sizeInTiles.w = j + 1; }
    }
  }
  this.wrapLevel();
  this.updateDimensions(sizeInTiles);
  this.updateDetails();
  this.stats.setLevelInfo(level, levelArray[0]);
  localData(this.stats.fName + ':currentLevel', level);
  this.loaded = true;
  this.eventLocks = 0;
};

Map.prototype.wrapLevel = function() {
  var empty = false;
  for (var i = 0; i < this.level.length; i++) {
    for (var j = 0; j < this.level[i].length; j++) {
      if (this.level[i - 1] === undefined) { empty = true; }
      else if (this.level[i - 1][j] === undefined) { empty = true; }
      else if (this.level[i - 1][j].constructor === Empty) { empty = true; }
      if (this.level[i][j]) {
        if (empty && this.level[i][j].constructor === Floor) { this.level[i][j] = new Empty(); }
      }
      empty = false;
    }
  }
  for (var i = this.level.length - 1; i >= 0; i--) {
    for (var j = 0; j < this.level[i].length; j++) {
      if (this.level[i + 1] === undefined) { empty = true; }
      else if (this.level[i + 1][j] === undefined) { empty = true; }
      else if (this.level[i + 1][j].constructor === Empty) { empty = true; }
      if (this.level[i][j]) {
        if (empty && this.level[i][j].constructor === Floor) { this.level[i][j] = new Empty(); }
      }
      empty = false;
    }
  }
};

Map.prototype.updateDimensions = function(sizeInTiles) {
  for (var i = 0; i < this.tileSizes.length; i++) {
    this.tileSize = this.tileSizes[i];
    if ((sizeInTiles.w <= this.width / this.tileSizes[i]) && (sizeInTiles.h <= this.height / this.tileSizes[i])) {
      this.lWidth = sizeInTiles.w * this.tileSize;
      this.lHeight = sizeInTiles.h * this.tileSize;
      this.lLeft = Math.round((this.width / 2) - (this.lWidth / 2) + this.left);
      this.lTop = Math.round((this.height / 2) - (this.lHeight / 2) + this.top);
      break;
    }
  }
};

Map.prototype.updateDetails = function() {
  for (var i = 0; i < this.boxes.length; i++) {
    this.boxes[i].setCoords(this.boxes[i].x, this.boxes[i].y);
    this.boxes[i].updateDetails();
  }
  this.player.setCoords(this.player.x, this.player.y);
  this.player.updateDetails();
};

Map.prototype.checkOccupied = function(x, y, checkEnt) {
  if (checkEnt === undefined) checkEnt = true;
  var returnObject = this.level[y][x];
  if (checkEnt) {
    for (var i = 0; i < this.boxes.length; i++) {
      if ((this.boxes[i].x == x) && (this.boxes[i].y == y)) {
        returnObject = this.boxes[i];
        break;
      }
    }
  }
  return returnObject;
};

Map.prototype.checkPointer = function(x, y) {
  var direction = { x: 0, y: 0 };
  var nextBox = false;
  if ((x < this.lLeft) || (x > (this.lLeft + this.lWidth)) || (y < this.lTop) || (y > (this.lTop + this.lHeight))) { return direction; }
  if (((x < this.player.xPx) && ((y > this.player.yPx) && (y < this.player.yPx + this.tileSize)))
   || ((x < (this.player.xPx - this.tileSize)) && ((y > (this.player.yPx - this.tileSize)) && (y < this.player.yPx + (2 * this.tileSize))))) {
    direction.x = -1;
  } else if (((x > (this.player.xPx + this.tileSize)) && ((y > this.player.yPx) && (y < this.player.yPx + this.tileSize)))
          || ((x > (this.player.xPx + (2 * this.tileSize))) && ((y > (this.player.yPx - this.tileSize)) && (y < this.player.yPx + (2 * this.tileSize))))) {
    direction.x = 1;
  }
  if (((y < this.player.yPx) && ((x > this.player.xPx) && (x < this.player.xPx + this.tileSize)))
   || ((y < (this.player.yPx - this.tileSize)) && ((x > (this.player.xPx - this.tileSize)) && (x < this.player.xPx + (2 * this.tileSize))))) {
    direction.y = -1;
  } else if (((y > (this.player.yPx + this.tileSize)) && ((x > this.player.xPx) && (x < this.player.xPx + this.tileSize)))
          || ((y > (this.player.yPx + (2 * this.tileSize))) && ((x > (this.player.xPx - this.tileSize)) && (x < this.player.xPx + (2 * this.tileSize))))) {
    direction.y = 1;
  }
  nextBox = this.checkOccupied(this.player.x + direction.x, this.player.y + direction.y).constructor === Box;
  if (nextBox) {
    direction.x = ((x > this.player.xPx - this.tileSize) && (x < this.player.xPx + (2 * this.tileSize))) ? 0 : direction.x;
    direction.y = ((y > this.player.yPx - this.tileSize) && (y < this.player.yPx + (2 * this.tileSize))) ? 0 : direction.y;
  }
  return direction;
};

Map.prototype.pushUndo = function() {
  this.undoPool.push({
    boxes: [],
    player: {x: this.player.x, y: this.player.y},
    moves: this.stats.levelStats.moves,
    pushes: this.stats.levelStats.pushes
  });
  var index = this.undoPool.length - 1;
  for (var i = 0; i < this.boxes.length; i++) {
    this.undoPool[index].boxes.push({x: this.boxes[i].x, y: this.boxes[i].y});
  }
};

Map.prototype.undo = function() {
  var u = this.undoPool.pop();
  if (u) {
    for (var i = 0; i < this.boxes.length; i++) { this.boxes[i].setCoords(u.boxes[i].x, u.boxes[i].y); }
    this.player.setCoords(u.player.x, u.player.y);
    this.stats.levelStats.moves = u.moves;
    this.stats.levelStats.pushes = u.pushes;
  }
};

Map.prototype.checkCompleted = function() {
  for (var i = 0; i < this.boxes.length; i++) {
    if (!this.boxes[i].onGoal) { return false; }
  }
  return true;
};

Map.prototype.loadNextLevel = function() {
  var nr = getNextIndex(this.stats.levelStats.nr, this.collection);
  this.loadLevel(nr);
};

Map.prototype.restartLevel = function() {
  this.loadLevel(this.stats.levelStats.nr);
};

Map.prototype.loadPrevLevel = function() {
  var nr = getPrevIndex(this.stats.levelStats.nr, this.collection);
  this.loadLevel(nr);
};

//---------------- Stats ------------------//

function Stats(map) {
  this.map = map;
  this.left = 10; this.top = 10;
  this.textColor = 'hsla(0, 0%, 40%, 1)';
  this.completedTextColor = 'hsla(151, 30%, 53%, 1)';
  this.fName = '';
  this.collectionInfo = {};
  this.collectionStats = {};
  this.levelInfo = {};
  this.levelStats = {};
  this.resetCollection();
  this.resetLevel();
}

Stats.prototype.resetCollection = function() {
  this.fName = '';
  this.collectionInfo = { title: '', author: '', mail: '', web: '' };
  this.collectionStats = { count: 0, completed: 0 };
};

Stats.prototype.resetLevel = function() {
  this.levelInfo = { title: '' };
  this.levelStats = { nr: 0, moves: 0, pushes: 0, bestMoves: 0, bestPushes: 0 };
};

Stats.prototype.setCollectionInfo = function(fName, string, count) {
  this.fName = fName;
  this.collectionStats.count = count;
  this.loadLocalCollectionData();
  var i = 0; var s;
  var info = this.collectionInfo;
  for (var p in info) {
    s = p.toUpperCase() + '|';
    i = string.indexOf(s, i);
    if (i > -1) {
      i += s.length;
      info[p] = string.substring(i, string.indexOf('|', i));
    }
  }
};

Stats.prototype.setLevelInfo = function(nr, string) {
  this.levelStats.nr = nr;
  this.loadLocalLevelData();
  var i = string.indexOf(' '); var s;
  s = (i > -1) ? string.substring(0, i) : string;
  if (isNaN(s)) {
    this.levelInfo.title = string;
  } else {
    this.levelInfo.title = (i > -1) ? string.substring(i + 1) : '';
  }
};

Stats.prototype.loadLocalCollectionData = function() {
  var d = localData(this.fName + ':collectionData');
  if (d) { this.collectionStats.completed = d.completed; }
};

Stats.prototype.loadLocalLevelData = function() {
  var d = localData(this.fName + ':levelData:' + this.levelStats.nr);
  if (d) { this.levelStats = d; this.levelStats.moves = 0; this.levelStats.pushes = 0; }
};

Stats.prototype.saveLocalData = function() {
  localData(this.fName + ':collectionData', this.collectionStats);
  localData(this.fName + ':levelData:' + this.levelStats.nr, this.levelStats);
};

Stats.prototype.render = function(ctx) {
  var info = this.collectionInfo; var s;
  ctx.fillStyle = this.textColor;
  s = (this.levelStats.nr + 1) + '/' + this.collectionStats.count;
  s += (this.levelInfo.title) ? ' - ' + this.levelInfo.title : '';
  if (s.length < 45) { s = this.collectionInfo.title + ' - ' + s; }
  ctx.fillText(s, this.left, this.top);
  s = 'Best: ' + this.levelStats.bestMoves + '/' + this.levelStats.bestPushes;
  ctx.fillText(s, this.left, 480);
  ctx.fillStyle = (this.map.completed) ? this.completedTextColor : this.textColor;
  s = 'Moves: ' + this.levelStats.moves + ' ';
  s += 'Pushes: ' + this.levelStats.pushes;
  ctx.fillText(s, this.left, 455);
};

//--------------- Movable -----------------//

function Movable(map, x, y) {
  if (x === undefined) x = 0; if (y === undefined) y = 0;
  this.map = map;
  this.x = x; this.y = y;
  this.xPx = 0; this.yPx = 0;
  this.onGoal = false;
  this.moveAnimation = {speed: 100, destination: { x: 0, y: 0, xPx: 0, yPx: 0 }, isAnimating: false};
  this.colors = { f: 'hsla(0, 0%, 0%, 1)', b: 'hsla(0, 0%, 0%, 1)', s: 'hsla(0, 0%, 0%, 1)' };
  this.details = { size: 0, borderWidth: 0, margin: 0, shadowOffset: 0, shadowBlur: 0 };
}

Movable.prototype.reset = function() {
  this.x = 0; this.y = 0;
  this.xPx = 0; this.yPx = 0;
  this.moveAnimation.isAnimating = false;
};

Movable.prototype.setCoords = function(x, y) {
  this.onGoal = this.map.checkOccupied(x, y, false).constructor === Goal;
  this.x = x; this.y = y;
  this.xPx = this.map.lLeft + (this.map.tileSize * this.x);
  this.yPx = this.map.lTop + (this.map.tileSize * this.y);
};

Movable.prototype.updateDetails = function() {
  scaleFactor = this.map.shadowScaleFactor;
  this.details.borderWidth = Math.floor(this.map.tileSize / 10);
  this.details.margin = Math.floor(this.details.borderWidth / 2);
  this.details.size = this.map.tileSize - (2 * (this.details.borderWidth + Math.ceil(this.details.margin / 2)));
  this.details.shadowOffset = Math.ceil(this.map.tileSize / 30 * scaleFactor);
  this.details.shadowBlur = Math.floor(this.details.borderWidth / 2 * scaleFactor);
  this.details.borderWidth = (this.details.borderWidth % 2 === 0) ? this.details.borderWidth : this.details.borderWidth + 0.5;
  var tilesPerSecond = 5;
  this.moveAnimation.speed = this.map.tileSize * tilesPerSecond;
};

Movable.prototype.startMove = function(dX, dY) {
  this.moveAnimation.destination.x = dX;
  this.moveAnimation.destination.y = dY;
  this.moveAnimation.destination.xPx = this.map.lLeft + (this.map.tileSize * dX);
  this.moveAnimation.destination.yPx = this.map.lTop + (this.map.tileSize * dY);
  this.moveAnimation.isAnimating = true;
};

Movable.prototype.stopMove = function() {
  this.moveAnimation.isAnimating = false;
  var x = this.moveAnimation.destination.x;
  var y = this.moveAnimation.destination.y;
  this.setCoords(x, y);
};

Movable.prototype.update = function(fTime) {
  var addX, addY;
  if (this.moveAnimation.isAnimating) {
    directionX = this.moveAnimation.destination.x - this.x;
    directionY = this.moveAnimation.destination.y - this.y;
    addX = (fTime * this.moveAnimation.speed) * directionX;
    addY = (fTime * this.moveAnimation.speed) * directionY;
    this.xPx += addX; this.yPx += addY;
    if (((directionX > 0) && (this.xPx >= this.moveAnimation.destination.xPx))
     || ((directionX < 0) && (this.xPx <= this.moveAnimation.destination.xPx))
     || ((directionY > 0) && (this.yPx >= this.moveAnimation.destination.yPx))
     || ((directionY < 0) && (this.yPx <= this.moveAnimation.destination.yPx))) { this.stopMove(); }
  }
};

Movable.prototype.render = function(ctx) {
  var tX, tY, tR;
  ctx.save();
  ctx.fillStyle = this.colors.f;
  tX = this.xPx + this.details.borderWidth + this.details.margin;
  tY = this.yPx + this.details.borderWidth + this.details.margin;
  ctx.fillRect(tX, tY, this.details.size, this.details.size);
  ctx.strokeStyle = this.colors.b;
  ctx.lineWidth = this.details.borderWidth;
  ctx.shadowOffsetX = this.details.shadowOffset;
  ctx.shadowOffsetY = this.details.shadowOffset;
  ctx.shadowBlur = this.details.shadowBlur;
  ctx.shadowColor = this.colors.s;
  tX -= Math.floor(this.details.borderWidth / 2);
  tY -= Math.floor(this.details.borderWidth / 2);
  ctx.strokeRect(tX, tY, this.details.size, this.details.size);
  ctx.restore();
};

Movable.prototype.checkMove = function(x, y) {
  var canMove = false;
  var nextCellObject = this.map.checkOccupied(x, y);
  switch (nextCellObject.constructor) {
    case Wall:
      return canMove;
      break;
    case Box:
      canMove = (this.constructor === Box) ? false : nextCellObject.checkMove(nextCellObject.x + (x - this.x), nextCellObject.y + (y - this.y));
      break;
    default:
      canMove = true;
  }
  if (canMove) { this.startMove(x, y); }
  return canMove;
};

//---------------- Player -----------------//

function Player(map, x, y) {
  Movable.call(this, map, x, y);
}

Player.prototype = new Movable();
Player.prototype.constructor = Player;

Player.prototype.updateDetails = function() {
  Movable.prototype.updateDetails.call(this);
  this.colors.f = this.map.colors.player;
  this.colors.b = 'hsla(0, 0%, 40%, 1)';
  this.colors.s = 'hsla(0, 0%, 30%, 1)';
};

Player.prototype.startMove = function(dX, dY) {
  Movable.prototype.startMove.call(this, dX, dY);
  this.map.pushUndo();
  this.map.eventLocks++;
};

Player.prototype.stopMove = function() {
  Movable.prototype.stopMove.call(this);
  this.map.stats.levelStats.moves++;
  this.map.eventLocks--;
};

//----------------- Box -------------------//

function Box(map, x, y) {
  Movable.call(this, map, x, y);
}

Box.prototype = new Movable();
Box.prototype.constructor = Box;

Box.prototype.updateDetails = function() {
  Movable.prototype.updateDetails.call(this);
  this.colors.f = this.map.colors.box;
  this.colors.b = 'hsla(0, 0%, 80%, 1)';
  this.colors.s = 'hsla(0, 0%, 50%, 1)';
};

Box.prototype.startMove = function(dX, dY) {
  Movable.prototype.startMove.call(this, dX, dY);
  this.map.eventLocks++;
};

Box.prototype.stopMove = function() {
  Movable.prototype.stopMove.call(this);
  this.map.boxMoved = true;
  this.map.stats.levelStats.pushes++;
  this.map.eventLocks--;
};

//----------------- Wall ------------------//

function Wall(map) {
  this.map = map;
  this.color = this.map.colors.wall;
}

Wall.prototype.render = function(ctx, x, y) {
  var bW, tX, tY, tS;
  bW = Math.floor(this.map.tileSize / 20);
  tS = this.map.tileSize - bW;
  ctx.fillStyle = this.color;
  ctx.beginPath();
  ctx.moveTo(x + (2 * bW), y + bW);
  ctx.lineTo(x + tS, y + bW);
  ctx.quadraticCurveTo(x + tS + bW, y + bW, x + tS + bW, y + (2 * bW));
  ctx.lineTo(x + tS + bW, y + tS);
  ctx.quadraticCurveTo(x + tS + bW, y + tS + bW, x + tS, y + tS + bW);
  ctx.lineTo(x + (2 * bW), y + tS + bW);
  ctx.quadraticCurveTo(x + bW, y + tS + bW, x + bW, y + tS);
  ctx.lineTo(x + bW, y + (2 * bW));
  ctx.quadraticCurveTo(x + bW, y + bW, x + (2 * bW), y + bW);
  ctx.fill();
  ctx.lineWidth = bW;
  ctx.strokeStyle = 'hsla(360, 100%, 100%, 0.1)';
  ctx.strokeRect(x + (4 * bW), y + (4 * bW), tS - (6 * bW), tS - (6 * bW));
};

//---------------- Floor ------------------//

function Floor(map) {
  this.map = map;
  this.color = 'hsla(0, 0%, RANDOM%, 1)'.replace('RANDOM', getRandomInt(90, 95));
}

Floor.prototype.render = function(ctx, x, y) {
  ctx.fillStyle = this.color;
  ctx.fillRect(x, y, this.map.tileSize, this.map.tileSize);
};

//----------------- Goal ------------------//

function Goal(map) {
  this.map = map;
  this.floor = new Floor(map);
  this.gColor = 'hsla(0, 0%, 40%, 1)';
}

Goal.prototype.render = function(ctx, x, y) {
  var tX, tY, tR;
  this.floor.render(ctx, x, y);
  ctx.fillStyle = this.gColor;
  tX = Math.round(x + (this.map.tileSize / 2));
  tY = Math.round(y + (this.map.tileSize / 2));
  tR = Math.ceil(this.map.tileSize / 5);
  ctx.beginPath();
  ctx.arc(tX, tY, tR, 0, (2 * Math.PI));
  ctx.fill();
};

//---------------- Empty ------------------//

function Empty() {}
Empty.prototype.render = function(ctx, x, y) {};

//-------------- Clickable ----------------//

function Clickable() {
  this.items = {};
}

Clickable.prototype.check = function(x, y, pointerDown, pointerHover) {
  if (pointerDown === undefined) pointerDown = false;
  if (pointerHover === undefined) pointerHover = true;
  var returnValue = null;
  for (var p in this.items) {
    if ((x > this.items[p].x) && (x < this.items[p].x + this.items[p].w) && (y > this.items[p].y) && (y < this.items[p].y + this.items[p].h)) {
      this.items[p].hover = (pointerHover) ? true : false;
      this.items[p].active = (pointerDown) ? true : false;
      returnValue = p;
    } else {
      this.items[p].hover = false;
      this.items[p].active = false;
    }
  }
  return returnValue;
};

Clickable.prototype.deactivateAll = function() {
  for (var p in this.items) {
    this.items[p].active = false;
  }
};

//--------------- Controls ----------------//

function Controls() {
  this.clickable = new Clickable();
  this.clickable.items = {
    undo: {
      hover: false, active: false,
      x: 410, y: 452, w: 50, h: 50
    },
    prev: {
      hover: false, active: false,
      x: 500, y: 452, w: 50, h: 50
    },
    restart: {
      hover: false, active: false,
      x: 560, y: 452, w: 50, h: 50
    },
    next: {
      hover: false, active: false,
      x: 620, y: 452, w: 50, h: 50
    },
    title: {
      hover: false, active: false,
      x: 710, y: 452, w: 50, h: 50
    }
  };
  this.color = 'hsla(0, 0%, 70%, 1)';
  this.aColor = 'hsla(0, 0%, 50%, 1)';
}

Controls.prototype.render = function(ctx) {
  ctx.strokeStyle = this.color;
  ctx.lineWidth = 2;
  var lineLength = 20;
  var radius = 15;
  var items = this.clickable.items;
  for (var p in items) {
    lineLength = 20;
    ctx.save();
    if (items[p].hover) { ctx.strokeStyle = this.aColor; }
    if (items[p].active) { ctx.strokeStyle = this.aColor; }
    var x = items[p].x; var y = items[p].y;
    var w = items[p].w; var h = items[p].h;
    var cX = x + (w / 2); var cY = y + (h / 2);
    ctx.strokeRect(x, y, w, h);
    ctx.beginPath();
    if (p == 'restart') {
      ctx.arc(cX, cY, radius, (240 * Math.PI / 180), (190 * Math.PI / 180));
    } else {
      var deg = 0; var rDeg = 0;
      var dX = 0; var dY = 0;
      switch (p) {
        case 'undo':
          lineLength = 10;
          dX = cX + 8; dY = cY + 12;
          ctx.moveTo(dX, dY);
          ctx.lineTo(dX, dY - lineLength);
          ctx.quadraticCurveTo(dX, dY - (2 * lineLength), dX - lineLength, dY - (2 * lineLength));
          ctx.lineTo(dX - (2 * lineLength), dY - (2 * lineLength));
          deg = 45; cX -= 13; cY -= 8; break;
        case 'prev':
          deg = 45; cX -= 10; break;
        case 'next':
          deg = 225; cX += 10; break;
        case 'title':
          deg = 45; break;
      }
      drawArrow(ctx, deg, cX, cY, lineLength);
      if (p === 'title') { deg = 225; drawArrow(ctx, deg, cX, cY, lineLength); }
    }
    ctx.stroke();
    ctx.restore();
  }
};

//-------------- Title Menu ---------------//

function TitleMenu() {
  this.clickable = new Clickable();
  this.clickable.items = {
    prevCollection: {
      hover: false, active: false,
      x: 670, y: 170, w: 50, h: 50
    },
    nextCollection: {
      hover: false, active: false,
      x: 730, y: 170, w: 50, h: 50
    },
    prevLevel: {
      hover: false, active: false,
      x: 670, y: 20, w: 50, h: 50
    },
    nextLevel: {
      hover: false, active: false,
      x: 730, y: 20, w: 50, h: 50
    },
    play: {
      text: 'Play',
      hover: false, active: false,
      x: 20, y: 440, w: 110, h: 50
    }
  };
  this.items = {
    collection: {
      text: 'Collection', x: 660, y: 180, w: 0, h: 0
    },
    level: {
      text: 'Level', x: 660, y: 30, w: 0, h: 0
    }
  };
  this.color = 'hsla(0, 0%, 60%, 1)';
  this.aColor = 'hsla(0, 0%, 40%, 1)';
}

TitleMenu.prototype.render = function(ctx) {
  ctx.font = '30px csfont';
  ctx.textAlign = 'end';
  ctx.fillStyle = this.color;
  ctx.strokeStyle = this.color;
  ctx.lineWidth = 4;
  var lineLength = 20;
  var items = this.items;
  for (var p in items) {
    ctx.fillText(items[p].text, items[p].x, items[p].y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  items = this.clickable.items;
  for (var p in items) {
    ctx.save();
    if (items[p].hover) { ctx.fillStyle = this.aColor; ctx.strokeStyle = this.aColor; }
    if (items[p].active) { ctx.fillStyle = this.aColor; ctx.strokeStyle = this.aColor; }
    var x = items[p].x; var y = items[p].y;
    var w = items[p].w; var h = items[p].h;
    var cX = x + (w / 2); var cY = y + (h / 2);
    ctx.strokeRect(x, y, w, h);
    if (p == 'play') {
      ctx.fillText(items[p].text, cX, cY);
    } else {
      var deg = 0;
      var v = false;
      ctx.beginPath();
      switch (p) {
        case 'prevCollection':
          deg = 225; cY += 10; v = true; break;
        case 'prevLevel':
          deg = 45; cX -= 10; break;
        case 'nextCollection':
          deg = 45; cY -= 10; v = true; break;
        case 'nextLevel':
          deg = 225; cX += 10; break;
      }
      drawArrow(ctx, deg, cX, cY, lineLength, v);
      ctx.stroke();
    }
    ctx.restore();
  }
};

//-------------- Title Info ---------------//

function TitleInfo(stats) {
  this.stats = stats;
  this.cLeft = 780; this.cTop = 240;
  this.lLeft = 780; this.lTop = 90;
  this.color = 'hsla(0, 0%, 60%, 1)';
  this.lColor = 'hsla(0, 0%, 70%, 1)';
}

TitleInfo.prototype.render = function(ctx) {
  var i = 0; var s;
  var info = this.stats.collectionInfo;
  ctx.font = '30px csfont';
  ctx.textAlign = 'end';
  ctx.fillStyle = this.color;
  ctx.fillText(info['title'], this.cLeft, this.cTop);
  i += 2;
  ctx.font = '18px csfont';
  s = 'Completed: ' + this.stats.collectionStats.completed + '/' + this.stats.collectionStats.count;
  ctx.fillText(s, this.cLeft, ((18 * i) + this.cTop));
  i += 2;
  s = (this.stats.levelInfo.title) ? this.stats.levelInfo.title + ' - ' : '';
  s += (this.stats.levelStats.nr + 1) + '/' + this.stats.collectionStats.count;
  ctx.fillText(s, this.lLeft, this.lTop);
  s = 'Best: ' + this.stats.levelStats.bestMoves + '/' + this.stats.levelStats.bestPushes;
  ctx.fillText(s, this.lLeft, this.lTop + 22);
  ctx.font = '12px csfont';
  ctx.fillStyle = this.lColor;
  for (var p in info) {
    if (info[p] && p !== 'title') {
      ctx.fillText(info[p], this.cLeft, ((16 * i) + this.cTop));
      i++;
    }
  }
};