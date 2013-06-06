module.exports = function () {
  
  var logicProto = {
    
    'observe' : function () {
      var player = this.myMap.player,
          totalSenses = this.myMap.map[player.col][player.row].totalSenses;

      this.makeDecision(totalSenses);
      return this;
    },

    'history' : [],
    
    'time' : 0,

    'move' : function (from, to) {
    	this.myMap.map[from.col][from.row].id = 0;
      this.myMap.map[to.col][to.row].id = 'Player';
      this.history.visitedTiles.push(to);
      return this;
    },

    'eliminator' : function (adjacentTiles, totalSenses) {
    	var currentHistory = this.history[this.time],
    	    senses = ['Breeze', 'Smell', 'Shine'],
    	    possibilities = ['possiblePits','possibleMonsters','possibleGold'],
    	    returnValue = false;
    	//for each possibility the game allows
  	  for (var i = 0; i < possibilities.length; i += 1) {
        //for each possibility already determined from visits
        for (var k = 0; k < currentHistory[possibilities[i]].length; k += 1) {
					//if we have already determined that this tile is an already
					// determined possibility of possibilities allowed by the game
					if (adjacentTiles.indexOf(currentHistory[possibilities[i]][k]) !== -1 &&
						  //if there is a possiblity in the adjacent tile and we dont have that 
						  //sense in our current tile we can rule out the adjacent possibility
						  totalSenses.indexOf(senses[i]) === -1) {
						currentHistory[possibilities[i]].splice(currentHistory[possibilities[i].indexOf(currentHistory[possibilities[i]][k]), 1);
					  returnValue = true;
					}
        }
   	  }
   	  return returnValue; 
    },

    'checkCertainty' : function () {
      var obsticles = ['pits','possiblePits','monsters','possibleMonsters','possibleGold'],
          checkedTiles = [],
          currentSenses,
          adjacentTiles,
          matchedTiles = [],
          senses = {
          	'Breeze': 'possiblePits', 
          	'Smell': 'possibleMonsters',
          	'Shine': 'possibleGold'
          },
          definitiveSenses = {
          	'Breeze': 'pits',
          	'Smell': 'monsters',
          	'Shine': 'gold'
          }
          counter = 0,
          definitiveTile;
      //for every point in history
      for (var t = this.time; t >= 0; t -= 1) {
      	//for each tile in history
      	//if this is the first time we are analyzing it
        if (checkedTiles.indexOf(this.history[t].currentTile) === -1) {
        	checkedTiles.push(this.history[t].currentTile);
        	//get the senses of the tile
        	//get its adjacent tiles
        	currentSenses = this.history[t].senses;
          adjacentTiles = this.map.getAdjacentTiles(this.history[t].col, this.history[t].row);
          //for each of that tiles senses
          for (var i = 0; i < currentSenses.length; i += 1) {
          	counter = 0;
          	//for each tile that possibly produces the sense (generated by visited tiles only)
          	for (var k = 0; k < this.history[this.time][senses[currentSenses[i]]].length; k += 1) {
          		if (adjacentTiles.indexOf(this.history[this.time][senses[currentSenses[i]]][k]) !== -1) {
          			counter += 1;
          			//we have an adjacent tile that is in the possibility list
          			//one of the adjacent tile that is still a possibility
          			definitiveTile = this.history[this.time][senses[currentSenses[i]]][k]; 
          			if (counter > 1) break;
          		}
          	}

            if (counter === 1) {
            	//make that possibility a certainty
							this.history[this.time][definitiveSenses[currentSenses[i]]].push(definitiveTile);
							this.history[this.time][senses[currentSenses[i]]].splice(this.history[this.time][senses[currentSenses[i]]].indexOf(definitiveTile, 1));
            }

          }
        }
      }

    },

    'updatePotentials' : function (currentSenses, adjacentTiles) {
      var senses = {
      	'Breeze': 'possiblePits', 
      	'Smell': 'possibleMonsters',
      	'Shine': 'possibleGold'
      };
      //for each adjacent tile
      for (var i = 0; i < adjacentTiles.length; i += 1) {
      	//if it isnt a blank
      	if (this.history[this.time].safeTiles.indexOf(adjacentTiles[i]) === -1) {
          //for each sense of the current tile
          for (var k = 0; k < currentSenses.length; k += 1) {
          	//if the possibility list for that sense does not contain the adjacent tile
          	if (this.history[this.time][senses[currentSenses[k]]].indexOf(adjacentTiles[i]) === -1) {
          		//put that adjacent tile in the possibility list
          		this.history[this.time][senses[currentSenses[k]]].push(adjacentTiles[i]);
          	}
          }
      	}
      }
    },
    
    'makeDecision' : function (totalSenses) {
      var adjacentTiles = this.myMap.getAdjacentTiles(this.myMap.player.col, this.myMap.player.row),
          storedMove;
      
      this.history[this.time] = {
      	'senses': totalSenses,
      	'currentTile' : this.map[this.myMap.player.col][this.myMap.player.row],
      	'row' : this.myMap.player.row,
      	'col' : this.myMap.player.col,
      	'time': this.time,
      	'visitedTiles' : this.history[this.time - 1].visitedTiles,
      	'safeTiles': this.history[this.time - 1].safeTiles,
      	'pits': this.history[this.time - 1].pits,
      	'gold': this.history[this.time - 1].gold,
      	'possiblePits': this.history[this.time - 1].possiblePits,
      	'monsters': this.history[this.time - 1].monsters,
      	'possibleMonsters': this.history[this.time - 1].possibleMonsters,
      	'possibleGold' : this.history[this.time - 1].possibleGold
      }
      //update the possibility lists and the definitive lists
      this.updatePotentials(currentSenses, adjacentTiles);

      if (this.eliminator(adjacentTiles, totalSenses)) {
      	this.checkCertainty(this.myMap.player.col, this.myMap.player.row, adjacentTiles);
      }
      //if we don't sense anything and we have adjacent tiles
      if (totalSenses.length === 0 && adjacentTiles.length) {
        //update safe tiles.
      	for (var i = 0; i < adjacentTiles.length; i += 1) {
      		if (this.history[this.time].safeTiles.indexOf(adjacentTiles[i]) === -1) {
						this.history[this.time].safeTiles.push(adjacentTiles[i]);
      		}
      		//if the adjacent tile has not been visited
      		if (this.history.visitedTiles.indexOf(adjacentTiles[i]) === -1) {
      			//store move for later visitation
      			storedMove = adjacentTiles[i];
				  }
				  if (!storedMove) {
				  	//we have already visited every adjacent tile...what now?
				  }
       	}
				//move the player
		 		this.move(this.myMap.player, storedMove);
      } else if (totalSenses.length !== 0 && adjacentTiles.length) {
        //see if we can make a route to the gold?
        if (this.history[this.time].gold.length) {
          //generate a tilemap that fits the mental tilemap we construct for our history of safe tiles
          //can we make a path (aStar) with the generated map
          //if theres a path, take it, otherwwise..keep exploring?
        }
        //if one of our adjacent tiles is safe and has not been visited, go there
        //if any safe tiles haven not been visited, make your way  to that unvisited safe tile
        //we need to take a chance and shoot
        //impossible
      } else {
      	//start shooting shit

      }

      this.time += 1;
 
      return this;
    };

  };

  return function (OO) {
  	return Object.create(logicProto).extend(OO);
  }

};