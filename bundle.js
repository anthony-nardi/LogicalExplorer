;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
require('./extend');

var map = require('./map'),
    gameObjects = require('./gameObjects');

window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
	canvasApp();
}

function canvasApp() {
  var canvas = document.getElementById('myCanvas');
  
  myMap = map({  
    'canvas': canvas,
    'ctx': canvas.getContext('2d')
  });

  window.myMap = myMap;
}
},{"./extend":2,"./map":3,"./gameObjects":4}],2:[function(require,module,exports){
// All credit to Anthony Nardi
// git@github.com:anthony-nardi/Extends.git

if (!Object.prototype.extend) {

  Object.prototype.extend = function (object) {

    for (key in object) {

      if (typeof object[key] === 'object' 
         && typeof this[key] === 'object'
         && this.hasOwnProperty(key)) {
        
        this[key].extend(object[key]);

      } else {
        this[key] = object[key];
      }
    }
    return this;
  };
};
},{}],4:[function(require,module,exports){

},{}],3:[function(require,module,exports){
module.exports = (function () {
  var tile = require('./tile');
  var boardProto = {

    'columns' : 10,

    'rows' : 10,
    
    'pitColor' : '#dd0000',
    'monsterColor' : '#014421',
    'ladderColor' : '#98744e',
    'goldColor' : '#fbff00',
    'ammoColor' : '#000000',

    'maxPit': 10,
    'maxMonster': 1,
    'maxLadder': 1,
    'maxGold': 1,
    'maxAmmo': 1,

    'createGameArray' : function () {
      var gameState = [];
      for (var col = 0; col < this.columns; col += 1) {
        gameState.push([])
        for (var row = 0; row < this.rows; row += 1) {
          gameState[col].push(tile({
            'id': 0, 
            'row' : row, 
            'col' : col, 
            'board' : this,
            'mutable' : [],
            'immutable' : []  
          }));
        }
      }
      this.map = gameState;
      return this;
    },

    'drawGameBoard' : function () {
      var ctx = this.ctx,
          myCanvas = this.canvas,
          tileWidth = this.canvas.width / this.rows,
          tileHeight = this.canvas.height / this.columns;
      //draw outline

      ctx.lineWidth = 3;
      ctx.strokeRect(0,0,myCanvas.width, myCanvas.height);

      //draw circles

      for (var col = 0; col < this.columns; col += 1) {
        for (var row = 0; row < this.rows; row += 1) {
          if (this.map[col][row].id === 0) {
            ctx.fillStyle = '#ffffff';
          } else if (this.map[col][row].id === 'Pit') {
            ctx.fillStyle = this.pitColor;
          } else if (this.map[col][row].id === 'Monster') {
            ctx.fillStyle = this.monsterColor;
          } else if (this.map[col][row].id === 'Gold') {
            ctx.fillStyle = this.goldColor;
          } else if (this.map[col][row].id === 'Ammo') {
            ctx.fillStyle = this.ammoColor;
          } else if (this.map[col][row].id === 'Ladder') {
            ctx.fillStyle = this.ladderColor;
          }

          ctx.fillRect(col * tileWidth, row * tileHeight, tileWidth, tileHeight);
          ctx.strokeRect(col * tileWidth, row * tileHeight, tileWidth, tileHeight);
        }
      }
      return this;
    },
    
    'generateObstacle' : function () {

      var colLength = this.map[0].length,
          rowLength = this.map.length,
          ids = ['Pit','Monster','Gold','Ammo','Ladder'],
          senses = ['Breeze', 'Smell', 'Shine', 'Smoke', undefined],
          max = [this.maxPit,this.maxMonster,this.maxGold,this.maxAmmo,this.maxLadder],
          numObjs;
      
      for (var i = 0; i < ids.length; i += 1) {
        numObjs = Math.floor(Math.random()* max[i]) || 1;
        for (var k = 0; k < numObjs; k += 1) {
         // var currentObject = Object.create(gameObjects[ids[i]])
          var randPos = this.getRandPos();
          //get tile and set id
           
          this.map[randPos[0]][randPos[1]].id = ids[i];
          this.map[randPos[0]][randPos[1]].sense = senses[i];
      
      //    currentObject.col = randPos[0];
      //    currentObject.row = randPos[1];
      
       //   this.objectsArray.push(currentObject);       
        }
      }
      return this;
    
    },
    
    'desenfyMap' : function () {
      for (var row = 0; row < this.rows; row += 1) {
        for (var col = 0; col < this.columns; col += 1) {
          if (this.map[col][row].mutable.length) {
            this.map[col][row].mutable = [];
          }
        }
      }
      return this;
    },

    'getRandPos' : function () {
      var  startX = Math.floor(Math.random()* this.columns),
           startY = Math.floor(Math.random()* this.rows);

      if (this.map[startX][startY].id === 0) {
        return [startX, startY];
      } else {
        return this.getRandPos();
      }
    
  },
  
  'sensify' : function  (isFirstTime) {
    for (var row = 0; row < this.rows; row += 1) {
      for (var col = 0; col < this.columns; col += 1) {
        if (this.map[col][row].id !== 0 && this.map[col][row].id !== 'Ladder') {
          var adjacents = this.getAdjacentTiles(col, row);
          for (var i = 0;  i < adjacents.length; i += 1) {
            if (adjacents[i].id === 0 || adjacents[i].id === 'Ladder') {
              if (this.map[col][row].id !== 'Pit') {
                if (adjacents[i].mutable.indexOf(this.map[col][row].sense) === -1) {
                  adjacents[i].mutable.push(this.map[col][row].sense);
                } 
              } else if (isFirstTime) {
                if (adjacents[i].immutable.indexOf(this.map[col][row].sense) === -1) {
                  adjacents[i].immutable.push(this.map[col][row].sense);
                }
              }
            }
          }
        }
      }
    }
    return this;
  },

  'getAdjacentTiles' : function (col, row) {
    var adjacents = [];
    for (var startCol = col - 1; startCol <= col + 1; startCol += 1) {
      for (var startRow = row - 1; startRow <= row + 1; startRow += 1) {
        if (this.map[startCol] && this.map[startCol][startRow]) {
          adjacents.push(this.map[startCol][startRow]);
        }
      }
    }
    return adjacents;
  }
  }

  var init = function (that) {
    that.createGameArray().generateObstacle().sensify(1).drawGameBoard();
  
    return that;
  }

  return function (OO) {
    return init(Object.create(boardProto).extend(OO));
  }             

}());
},{"./tile":5}],5:[function(require,module,exports){
module.exports = (function () {
	
	var tileProto = {
	  'totalSenses' : function () {
	    var array = [];
      for (var i = 0; i < this.mutable.length; i += 1) {
      	array.push(this.mutable[i]);
      }
      for (var i = 0; i < this.immutable.length; i += 1) {
      	array.push(this.immutable[i]);
      }
      return array;
	  } 
	}

	return function (OO) {
    return Object.create(tileProto).extend(OO);
	}

}())
},{}]},{},[1])
;