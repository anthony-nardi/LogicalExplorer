module.exports = (function () {
  var aStar = require('./astar');
  var logicProto = {
    
    'observe' : function () {
      if (history.takenGold) {
        conseol.log('&&&%%%%%%%^^^^^^^^^^^^^^^^&&&&****************((((((((((((')
        return;
      };
      console.log('player queue');
      console.log(this.myMap.player.queue);
      var player = this.myMap.player,
          totalSenses = this.myMap.map[player.col][player.row].totalSenses || [],
          adjacentTiles = this.myMap.getAdjacentTiles(player.col, player.row),
          that = this;

        //store the history of what we sensed when we entered a tile

        if (this.time) {
          this.history[this.time] = {
            'senses': totalSenses,
            'monsterAlive' : this.history[this.time - 1].monsterAlive,
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
            'possibleGold' : this.history[this.time - 1].possibleGold,
            'ladder': this.history[this.time - 1].ladder,
            'takenGold' : this.history[this.time - 1].takenGold
          }
        }

        // If there are no senses in the tile the player is in we can say for sure
        // that all of the adjacent tiles are safe.

        if (totalSenses.length === 0 && adjacentTiles.length) {
          for (var i = 0; i < adjacentTiles.length; i += 1) {
            if (this.history[this.time].safeTiles.indexOf(adjacentTiles[i]) === -1) {
              this.history[this.time].safeTiles.push(adjacentTiles[i]);
            }
          }
        }
        
        // There are no senses for the ladder, so if we come accross it we store it.
        if (this.map[player.col][player.row].id === 'Ladder') {
          this.history[this.time].ladder = [this.map[player.col][player.row]];
          // If we have the gold the game is over, we have reached the ladder with the gold.
          if (player.gold) {
            this.over = true;
            return;
          }
        }

        // The first thing we have to do is update potential spaces.  We check to see what
        // senses we have, then look to see if those adjacent cells that could contain the 
        // monster or pit are in our safe tile list or are already in the pit or monster list.

        this.updatePotentials(totalSenses, adjacentTiles);

        // With newly updated potentails we have the chance to start ruling things out.  If we do rule
        // something out then we will check if we can say anything for certain.

        if (this.eliminator(adjacentTiles, totalSenses)) {
          this.checkCertainty(this.myMap.player.col, this.myMap.player.row, adjacentTiles);
        }

        // The queue is formed when we make a path to a tile, we call the move function with one element of the 
        // queue at a time to drain the queue.


        if (player.queue.length) {
          if (player.queue[0][1]) {
            this.move(player.queue[0]);
          }
          player.queue.splice(0, 1);
        } else {
          this.makeDecision(totalSenses);
        }
      

      // Just so we can see the game evolve slowly we use a set timeout here. 
      
      setTimeout(function () {
        if (!that.over) {
          that.observe();
          that.myMap.drawGameBoard(that.history[that.time - 1].safeTiles , that.history[that.time - 1].visitedTiles);
        }
      }, 200);
     
      return this;
    },

    'history' : [],
    
    'time' : 0,

    'move' : function (action) {
      var player = this.myMap.player,
          time = this.history[this.time],
          visitedTiles = time.visitedTiles,
          map = this.myMap.map;
          console.log('Action : ' + action[0]);
          console.log(action);

    // If we want to just move our player rather than shoot or take the gold,
      if (action[0] === 'Move') {
        
        // We want to leave the id 'Ladder' on the ladder tile for the whole game, so make sure we
        // do not change the id of the one we are coming from or going to if it is the ladder.

        console.log('this is the map')
        console.log(action[1])

        if (map[action[1].col][action[1].row].id !== 'Ladder') {
          map[action[1].col][action[1].row].id = 'Player';
        }

        if (map[player.col][player.row].id !== 'Ladder') {
          map[player.col][player.row].id = 0;
        }

        //Move our player on our map, and update our visited tiles in the history if it needs it.

        player.col = action[1].col;
        player.row = action[1].row;

        if (visitedTiles.indexOf(map[action[1].col][action[1].row]) === -1) {
            visitedTiles.push(map[action[1].col][action[1].row]);
        }       
      }

    // Now if we want to take a chance and try to shoot the monster...

      if (action[0] === 'Shoot') {
      // Check the tile to see if the one we are shooting at contains the monster.
        if (action[1].id === 'Monster') {
          player.ammo -= 1;
          time.monsterAlive = false;
          // If we did not know about this monster for certain, put it in the certain monsters array and take out all possible
          // monsters because there is only one.
          if (time.monsters.indexOf(action[1]) === -1) {
            time.monsters.push(action[1]);
            time.possibleMonsters = [];
          }
        } else {
      // if the tile does not contain the monster
          console.log('You shot but the monster was not in that tile');
          time.possibleMonsters.splice(time.possibleMonsters.indexOf(action[1]), 1);
        }
      }

      // Our last possible action is take, which alllows our player to take the gold.

      if (action[0] === 'Take') {  
        player.gold = true;
        time.takenGold = 1;
        console.log('Take ' + action[1]);
      }
      //
      if (!action) {
        that.over = true;
        console.log('Game Over')
      } 
      console.log('Increasing time');
      this.time += 1;
      return this;
    },

    'eliminator' : function (adjacentTiles, totalSenses) {
    	var currentHistory = this.history[this.time],
    	    senses = ['Breeze', 'Smell', 'Shine'],
    	    possibilities = ['possiblePits','possibleMonsters','possibleGold'],
    	    returnValue = false;
    	// Loop through possible pits, monsters and gold
  	  for (var i = 0; i < possibilities.length; i += 1) {
        // Loop through each member of possible pits, monsters or gold
        for (var k = 0; k < currentHistory[possibilities[i]].length; k += 1) {
            // if there is a possible pit, monster or gold saved in our history associated to an adjacent tile 
            // and we dont have that sense in our current tile we can rule out the adjacent possible pit, monster or gold
					if (adjacentTiles.indexOf(currentHistory[possibilities[i]][k]) !== -1 &&
						  totalSenses.indexOf(senses[i]) === -1) {
						currentHistory[possibilities[i]].splice(currentHistory[possibilities[i]].indexOf(currentHistory[possibilities[i]][k]), 1);
					  returnValue = true;
					}
        }
   	  }
      //Will be returned false if nothing was eliminated
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
          },
          counter = 0,
          definitiveTile;
      // for every point in time where we recorded a history
      for (var t = this.time; t >= 0; t -= 1) {
      	// if this is the first time we are analyzing it (we want the most recent history for each tile)
        if (checkedTiles.indexOf(this.history[t].currentTile) === -1) {
        	checkedTiles.push(this.history[t].currentTile);
        	//get the senses of the tile at that time in history and get its adjacent tiles
        	currentSenses = this.history[t].senses;
          adjacentTiles = this.myMap.getAdjacentTiles(this.history[t].col, this.history[t].row);
          //for each of that tiles senses
          if (currentSenses.length) {
            for (var i = 0; i < currentSenses.length; i += 1) {
              counter = 0;
              //Loop through the possible pits, monsters and gold for each sense
              for (var k = 0; k < this.history[this.time][senses[currentSenses[i]]].length; k += 1) {
                // If the adjacent tile is a possibility for the associated sense
                if (adjacentTiles.indexOf(this.history[this.time][senses[currentSenses[i]]][k]) !== -1) {
                  counter += 1;
                  // we set the definative tile in case the counter is only one, if the counter is one we know
                  // for sure if it goes higher than one we break out.
                  definitiveTile = this.history[this.time][senses[currentSenses[i]]][k]; 
                  if (counter > 1) break;
                }
              }
              // Make that possibility a certainty if the counter is one, because we can say for certain that
              // if we only have one possible location for a pit, it must be a pit.
              if (counter === 1) {
                this.history[this.time][definitiveSenses[currentSenses[i]]].push(definitiveTile);
                this.history[this.time][senses[currentSenses[i]]].splice(this.history[this.time][senses[currentSenses[i]]].indexOf(definitiveTile), 1);
              }
            }
          } 
        }
      }
    },

    'generatePath': function (start, end, shooting) {
        //create a path to the ladder through the safe tiles we know about
        var time = this.time,
            history = this.history[time],
            tileMap = this.generateTileMap(start, end);
        tileMap.endCol = end.col;
        tileMap.endRow = end.row;
        var path = aStar({
          'start': start, 
          'end': end, 
          'gameState': tileMap
        }).finalPath;
        if (path.length) {
          path.reverse();
          if (path[path.length -1] !== end) {
            path.push(end);
          }
          console.log('Follow path from ' + this.myMap.player.col + ', ' + this.myMap.player.row + ' to ' + path[path.length - 1]);
          console.log('This is the path');
          console.log(path)
          for (var i = 0; i < path.length; i += 1) {
            this.myMap.player.queue.push(['Move', path[i]]);
          }
          // If the last element of the array contains the gold we need to add a take action onto the end
          if (path[path.length - 1].id === 'Gold') {
            this.myMap.player.queue.push(['Take', path[path.length -1]]);
          }
          //If we are shooting we need to add shoot onto it
          if (shooting) {
            this.shootingLogic();
          }
          return true;
        } else {
          return false;
        }
      },

    'shootingLogic' : function () {
      var time = this.time,
          history = this.history[time],
          lastMove,
          adjacentMoves;
      if (history.monsters) {
        this.myMap.player.queue.push(['Shoot', history.monsters[0]]);
      } else {
        lastMove = this.myMap.player.queue[this.myMap.player.queue.length - 1];
        adjacentMoves = this.myMap.getAdjacentTiles(lastMove[1].col, lastMove[1].row);
        for (var i = 0; i < adjacentMoves.length; i += 1) {
          if (history.possibleMonsters.indexOf(adjacentMoves[i])) {
            this.myMap.player.queue.push(['Shoot', adjacentMoves[i]]);
          }
        }
      }
    },

    'updatePotentials' : function (totalSenses, adjacentTiles) {
      var senses = {
      	'Breeze': 'possiblePits', 
      	'Smell': 'possibleMonsters',
      	'Shine': 'possibleGold'
      },
      time = this.history[this.time],
      safeTiles = time.safeTiles;
      //for each adjacent tile to the one we are looking at
      for (var i = 0; i < adjacentTiles.length; i += 1) {
        //for each sense of the current tile
        for (var k = 0; k < totalSenses.length; k += 1) {
        	//if the possibility list for that sense does not contain the adjacent tile
        	if (time[senses[totalSenses[k]]].indexOf(adjacentTiles[i]) === -1) {
        		//put that adjacent tile in the possibility list
        		time[senses[totalSenses[k]]].push(adjacentTiles[i]);
            if (totalSenses[k] === 'Shine' && totalSenses.length === 1) {
              if (time.safeTiles.indexOf(adjacentTiles[i]) === -1) {
                time.safeTiles.push(adjacentTiles[i]);
              };
            }
        	}
        }
      }
    },

    'generateTileMap': function (start, end) {
      var tileMap = [],
          rows = [],
          cols = [],
          id, 
          startRow, endRow, startCol, endCol,
          safeTiles = this.history[this.time].safeTiles;
      // gather the rows and columns of the safe tiles we have in our history at this point in time
      for (var i = 0; i < safeTiles.length; i += 1) {
        rows.push(safeTiles[i].row);
        cols.push(safeTiles[i].col);
      }
      // we will sort here because we need to know how large to make our tile map
      rows.sort();
      cols.sort();
      // the starting row will be determined by the lowest row in our safe tiles and the highest row by the
      // highest row in our safe columns.  The same processw ill be completed for our columns.
      startRow = rows[0];
      endRow = rows[rows.length - 1];
      startCol = cols[0];
      endCol = cols[cols.length - 1];
      // We will generate the tile map here and any tiles outside of our known area will be undefined
      for (var col = startCol; col <= endCol; col += 1) {
        tileMap[col] = [];
        for (var row = startRow; row <= endRow; row += 1) {
          if (start && start.row === row && start.col === col) {
            id = 'Start'
          }
          if (end && end.row === row && end.col === col) {
            id = 'End'
          }
          if (safeTiles.indexOf(this.map[col][row]) !== -1) {
            tileMap[col][row] = {
              'id': id ? id : 0
            };
          } else {
            tileMap[col][row] = {
              'id' : id ? id : 'Blocked'
            };
            console.log('Blocked: ' + col + ', ' + row)
          }
          id = undefined;
        } 
      }
      // At this point we will have a tile map to return that is filled with 0's, start, end, blocked and undefined.  When we 
      // generate a path with aStar we will view 0's as safe and both blocked and undefined as not safe.
      return tileMap;
    },

    'findClosestSafe' : function () {
      // We do not have any adjacent unvisited safe tiles to move to so we will have to make a path to a safe tile we have not
      //visited yet.  We have to choose one to go to so we will pick the closest.
      
      var time = this.time,
          history = this.history[time],
          currRow = this.myMap.player.row,
          currCol = this.myMap.player.col,
          //arbitrarily set to 1,000,000 so the first time in the loop it gets over written
          finalOffset = 1000000,
          tileToReturn;
      
      // Loop through the tiles that are both safe and unvisited tiles and find the one that has
      // the lowest row and column offset from our current position

      for (var i = 0; i < history.safeTiles.length; i += 1) {
        if (history.visitedTiles.indexOf(history.safeTiles[i]) === -1) {
            var tempRowOffset = Math.abs(history.safeTiles[i].row - currRow),
              tempColOffset = Math.abs(history.safeTiles[i].col - currCol),
              tempOffset = tempRowOffset + tempColOffset;

          if (tempOffset < finalOffset) {
            finalOffset = tempOffset;
            tileToReturn = history.safeTiles[i];
          }
        }  
      }
      console.log('This is the tile to return');
      console.log(tileToReturn);
      return tileToReturn;
    },

    'moveAdjacent' : function (adjacentTiles) {
      var storedMove;
          time = this.time,
          history = this.history[time];
      for (var i = 0; i < adjacentTiles.length; i += 1) {
        // if the adjacent tile has not been visited we will store it because we will want to visit an unvistied 
        // safe tile for our move.
        if (history.safeTiles.indexOf(adjacentTiles[i]) !== -1 && history.visitedTiles.indexOf(adjacentTiles[i]) === -1) {
          storedMove = adjacentTiles[i];
        }
      } 
      // If we have visited all of its adjacent tiles, we need to find the closest
        if (storedMove) {
          //move the player
          if (storedMove.id === 'Gold') {
            this.myMap.player.queue.push(['Move', storedMove]);
            this.myMap.player.queue.push(['Take', storedMove]);
            return true;
          } else {
            this.myMap.player.queue.push(['Move', storedMove]);
            return true;
          }
        } else {
        return false;
      }
    },

    'makeDecision' : function (totalSenses) {
      //Our adjacent tiles will be up, down left and right if they are on the map
      var adjacentTiles = this.myMap.getAdjacentTiles(this.myMap.player.col, this.myMap.player.row),
          currTile = this.myMap.player,
          time = this.time,
          history = this.history[time];
          console.log('Make makeDecision');

     // If we have the gold and know where the ladder is lets make a path to the ladder if we can  

      if (history.takenGold && history.ladder[0]) {

        console.log('We have gold and we know where the ladder is');

          if (this.generatePath(currTile, history.ladder[0])) {
            return;
          }

      //else if we know where the gold is but we do not have it see if it is locatedin an adjacent tile, 
      // if not try to make a path to it

      } else if (history.gold[0] && !history.takenGold) {
        if (adjacentTiles.indexOf(history.gold)) {
         this.myMap.player.queue.push(['Move', history.gold]);
         this.myMap.player.queue.push(['Take', history.gold]); 
        } else if (this.generatePath(currTile, history.gold[0])) {
          console.log('know where gold is and have not taken it');
          return;
        }
      }

      // Now the next best thing we can do is explore adjacent tiles that are safe and unvisited
      // Do we have an adjacent tile that is both safe and unvisited?, if we do, moveAdjacent 
      // will return true and we will return from this function and make the move

      if (this.moveAdjacent(adjacentTiles)) {
        return;
      }

      // Now we know we can not make an adjacent move, we will have to make a path to the closest 
      // unvisited safe tile if there are any safe tiles we have not visited.

      if (history.safeTiles.length !== history.visitedTiles.length) {
        var tileToMoveTo = this.findClosestSafe();
        if (this.generatePath(currTile, tileToMoveTo)) {
          return;
        }
      }
      // Now we know that we do not have any more unvisited safe tiles, we have the option to shoot at the monster.
      // The first situation is when we know where the monster is, we can make a path there and shoot it

      // But first we need to get a safe tile that is adjacent to the monster to shoot from

      if (history.monsters[0]) {
        var adjacentToMonster = this.myMap.getAdjacentTiles(history.monsters[0].col, history.monsters[0].row);

        for (var i = 0; i < adjacentToMonster.length; i += 1) {
          if (history.safeTiles.indexOf(adjacentToMonster[i])) {
            this.generatePath(currTile, adjacentToMonster[i], 1);
            return;
          }
        }
      }

      // The second situation is that we do not know where the monster is for certain but we have some possibilites to try

      var possibleMonster = history.possibleMonsters[0];

      //We need to get adjacent to this spot

      var adjacentToPossibleMonster = this.myMap.getAdjacentTiles(possibleMonster.col, possibleMonster.row);

      for (var i = 0; i < adjacentToPossibleMonster.length; i += 1) {
        if (history.safeTiles.indexOf(adjacentToPossibleMonster[i])) {
          this.generatePath(currTile, adjacentToPossibleMonster[i], 1);
          return;
        }
      }

      // The last situation is that we do not even have a clue where the monster is and the game is over.
              
      console.log('IMPOSSIBLE TO WIN');
      return this;
  }
  };

  var init = function (that) {
      console.log(that)
      that.history[0] = {
        'senses': that.myMap.map[that.myMap.player.col][that.myMap.player.row].totalSenses || [],
        'monsterAlive' : true,
        'currentTile' : that.map[that.myMap.player.col][that.myMap.player.row],
        'row' : that.myMap.player.row,
        'col' : that.myMap.player.col,
        'time': 0,
        'visitedTiles' : [that.map[that.myMap.player.col][that.myMap.player.row]],
        'safeTiles': [that.map[that.myMap.player.col][that.myMap.player.row]],
        'pits': [],
        'gold': [],
        'possiblePits': [],
        'monsters': [],
        'possibleMonsters': [],
        'possibleGold' : [],
        'ladder': [],
        'takenGold': 0
      }
      that.over = false;
      that.myMap.player.queue = [];
      that.observe();
    return that;
  }

  return function (OO) {
  	return init(Object.create(logicProto).extend(OO));
  }

}());