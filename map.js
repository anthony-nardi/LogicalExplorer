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
    'playerColor' : '#ff208c',

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
          tileHeight = this.canvas.height / this.columns,
          tileId;
      //draw outline

      ctx.lineWidth = 3;
      ctx.strokeRect(0,0,myCanvas.width, myCanvas.height);

      //draw circles

      for (var col = 0; col < this.columns; col += 1) {
        for (var row = 0; row < this.rows; row += 1) {
          tileId = this.map[col][row].id;
          if (tileId === 0) {
            ctx.fillStyle = '#ffffff';
          } else if (tileId === 'Pit') {
            ctx.fillStyle = this.pitColor;
          } else if (tileId === 'Monster') {
            ctx.fillStyle = this.monsterColor;
          } else if (tileId === 'Gold') {
            ctx.fillStyle = this.goldColor;
          } else if (tileId === 'Ammo') {
            ctx.fillStyle = this.ammoColor;
          } else if (tileId === 'Ladder') {
            ctx.fillStyle = this.ladderColor;
          } else if (tileId === 'Player') {
            ctx.fillStyle = this.playerColor;
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
          var randPos = this.getRandPos();
          //get tile and set id
           
          this.map[randPos[0]][randPos[1]].id = ids[i];
          this.map[randPos[0]][randPos[1]].sense = senses[i];
            
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
              adjacents[i].totalSenses = adjacents[i].getTotalSenses();
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
        if (this.map[startCol] && 
            this.map[startCol][startRow] && 
            (this.map[col][row] !== this.map[startCol][startRow]) &&
            (startCol === 0 || startRow === 0)) {
          adjacents.push(this.map[startCol][startRow]);
        }
      }
    }
    return adjacents;
  },

  'placePlayer' : function () {
    var randPos = this.getRandPos();
    this.map[randPos[0]][randPos[1]].id = 'Player';
    this.player = {
      'col': randPos[0],
      'row': randPos[1]
    };
    return this;
  }



  }

  var init = function (that) {
    that.createGameArray().generateObstacle().placePlayer().sensify(1).drawGameBoard();
    
    return that;
  }

  return function (OO) {
    return init(Object.create(boardProto).extend(OO));
  }             

}());