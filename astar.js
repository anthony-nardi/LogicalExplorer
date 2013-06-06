module.exports = (function () {

  var astarTile = require('./astarTile')
  aStarProto = {

  	'current' : undefined,

  	'aStar' : function () {
  		var gameState = this.gameState,
  		    tempCurrent;

      if(!this.openSet.length) {
        console.log("there is no path to from start to end point");
        return false;
      }
      for (var i = 0; i < this.openSet.length; i += 1) {
        if (!tempCurrent || this.openSet[i].fScore < tempCurrent.fScore) {
        	tempCurrent = this.openSet[i];
        }
      }

      if(tempCurrent.id !== "Start" && tempCurrent.id !== "End") {
        tempCurrent.id = "Closed";
      }
      this.closedSet.push(tempCurrent);
      this.openSet.splice(this.openSet.indexOf(tempCurrent), 1);
      this.current = tempCurrent;
      this.fillOpenSet(gameState);

      //################******************######################
      if (this.current === this.gameState[this.myBoard.endRow][this.myBoard.endCol]) {
      	console.log('Path found.');
        this.finalPath = [];
      	this.setPath(this.current.parent);
      	return;
      }
      var that = this;
  	},

  	'fillOpenSet' : function () {
  		var gameState = this.gameState,
          currTile;
      for (var i = this.current.col - 1; i <= this.current.col + 1; i += 1) {
      	for (var k = this.current.row - 1; k <= this.current.row + 1; k += 1) {
          if (gameState[k] && gameState[k][i] && (i === 0 || k === 0)) {
            currTile = gameState[k][i];
            if (currTile.id !== 'Blocked' && this.closedSet.indexOf(currTile) === -1) {
              currTile.getFScore(this.current);
              if (this.openSet.indexOf(currTile) === -1) {
                this.openSet.push(currTile);
                if(currTile.id !== "End") {
                  currTile.id = "OpenSet";
                }
              }
            }
          }
      	}
      }
  	},

  	'setPath' : function (tile) {
  		if (tile.id === "Start") return this.finalPath;
  		this.finalPath.push(this.gameState[tile.row][tile.col]);
  		this.setPath(tile.parent);

  	}

  }
  
  var init = function (that) {
    that.openSet =  [];
  	that.closedSet = [];
    for (var i = 0; i < that.gameState.length; i += 1) {
      for (var k = 0; k < that.gameState[i].length; k += 1) {
        that.gameState[i][k].extend(astarTile({
          'board': gameState
        }))
      }
    }
    var startTile = that.start.extend(astarTile({
      'board': that.gameState
    }));
  	startTile.parent = startTile;
  	startTile.gScore = 0;
    startTile.getFScore(startTile);
	  that.openSet.push(startTile);
	  that.aStar(that.gameState);
  	return that;
  }

  return function (OO) {

  	return init(Object.create(aStarProto).extend(OO));
  }

}());
