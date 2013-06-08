module.exports = (function () {
  var aStar = require('./astar');
  var logicProto = {
    
    'observe' : function () {
      var player = this.myMap.player,
          totalSenses = this.myMap.map[player.col][player.row].totalSenses || [],
          adjacentTiles = this.myMap.getAdjacentTiles(player.col, player.row)
          that = this;
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
            'ladder': this.history[this.time - 1].ladder
          }
        }
        if (totalSenses.length === 0 && adjacentTiles.length) {
          for (var i = 0; i < adjacentTiles.length; i += 1) {

            if (this.history[this.time].safeTiles.indexOf(adjacentTiles[i]) === -1) {
              this.history[this.time].safeTiles.push(adjacentTiles[i]);
            }

          }
        }
        if (this.map[player.col][player.row].id === 'Ladder') {
          this.history[this.time].ladder = [this.map[player.col][player.row]];
          if (player.gold) {
            this.over = true;
            return;
          }
        }

        this.updatePotentials(totalSenses, adjacentTiles);

        if (this.eliminator(adjacentTiles, totalSenses)) {
          this.checkCertainty(this.myMap.player.col, this.myMap.player.row, adjacentTiles);
        }

        if (player.queue.length) {
          if (player.queue[0][1]) {
            this.move(player.queue[0]);
          }
          player.queue.splice(0, 1);
        } else {
          this.makeDecision(totalSenses);
        }
      
      setTimeout(function () {
        if (!that.over) {
          that.observe();
          that.myMap.drawGameBoard(that.history[that.time-1].safeTiles, that.history[that.time-1].visitedTiles);
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
          console.log('Action : ' + action[0])
          console.log(action)
      if (action[0] === 'Move') {
        
        if (map[action[1].col][action[1].row].id === 'Ladder') {

        } else {
        
          map[action[1].col][action[1].row].id = 'Player';
        }
        if (map[player.col][player.row].id === 'Ladder') {

        } else {
          map[player.col][player.row].id = 0;
        }
        player.col = action[1].col;
        player.row = action[1].row;
        if (visitedTiles.indexOf(map[action[1].col][action[1].row]) === -1) {
            visitedTiles.push(map[action[1].col][action[1].row]);
        }        
      }
      if (action[0] === 'Shoot') {
        if (action[1].id === 'Monster') {
          player.ammo -= 1;
          time.monsterAlive = false;
          if (time.monsters.indexOf(action[1]) === -1) {
            time.monsters[action[1]];
            time.possibleMonsters.splice(time.possibleMonsters.indexOf(action[1]), 1);
          }
        }
      }
      if (action[0] === 'Take') {
        
        player.gold = true;
      
        console.log('Take ' + action[1]);
      }
      if (!action) {
        that.over = true;
        console.log('Game Over')
      }
      this.time += 1;
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
						currentHistory[possibilities[i]].splice(currentHistory[possibilities[i]].indexOf(currentHistory[possibilities[i]][k]), 1);
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
          },
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
          adjacentTiles = this.myMap.getAdjacentTiles(this.history[t].col, this.history[t].row);
          //for each of that tiles senses
          //################******************######################
          for (var i = 0; i < currentSenses.length; i += 1) {
          	counter = 0;
          	//for each tile that possibly produces the sense (generated by visited tiles only)
          	for (var k = 0; k < this.history[this.time][senses[currentSenses[i]]].length; k += 1) {
          		if (adjacentTiles.indexOf(this.history[this.time][senses[currentSenses[i]]][k]) !== -1) {
          			counter += 1;
          			//we have an adjacent tile that is in the possibility list
          			//one of the adjacent tiles that is still a possibility
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

    'getOut': function () {
        console.log('GET OUTTTTTTT')
        if (this.history[this.time].safeTiles.indexOf(this.history[this.time].ladder[0]) !== -1) {
          //create path to tile we want to visit
          var tileMap = this.generateTileMap(this.myMap.player, this.history[this.time].safeTiles[i]);
          var endTile = this.history[this.time].ladder[0];
          console.log('End Tile - ')
          console.log(endTile)
          tileMap.endCol = endTile.col;
          tileMap.endRow = endTile.row;
          console.log(tileMap)
          var path = aStar({
            'start': this.myMap.player, 
            'end': endTile, 
            'gameState': tileMap
          }).finalPath;
          path.reverse();
          console.log('Follow path from ' + this.myMap.player.col + ', ' + this.myMap.player.row);
          console.log('This is the path');
          console.log(path)
          for (var i = 0; i < path.length; i += 1) {
            this.myMap.player.queue.push(['Move', path[i]]);
          }
          return;
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
      //for each adjacent tile
      for (var i = 0; i < adjacentTiles.length; i += 1) {
      	//if it isnt a safe tile
      	if (safeTiles.indexOf(adjacentTiles[i]) === -1) {
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
      }
    },

    'generateTileMap': function (start, end) {
      var tileMap = [],
          rows = [],
          cols = [],
          id, 
          startRow, endRow, startCol, endCol,
          safeTiles = this.history[this.time].safeTiles;
      for (var i = 0; i < safeTiles.length; i += 1) {
        rows.push(safeTiles[i].row);
        cols.push(safeTiles[i].col);
      }
      rows.sort();
      cols.sort();
      startRow = rows[0];
      endRow = rows[rows.length - 1];
      startCol = cols[0];
      endCol = cols[cols.length - 1];
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
      return tileMap;
    },

    
    
    
    'makeDecision' : function (totalSenses) {
      var adjacentTiles = this.myMap.getAdjacentTiles(this.myMap.player.col, this.myMap.player.row),
          storedMove;
          console.log('Make makeDecision')

      //if we don't sense anything and we have adjacent tiles
      if (totalSenses.length === 0 && adjacentTiles.length) {
        
        //update safe tiles.
      	for (var i = 0; i < adjacentTiles.length; i += 1) {

      		if (this.history[this.time].safeTiles.indexOf(adjacentTiles[i]) === -1) {
						this.history[this.time].safeTiles.push(adjacentTiles[i]);
      		}
      		//if the adjacent tile has not been visited
      		if (this.history[this.time].visitedTiles.indexOf(adjacentTiles[i]) === -1) {
      			//store move for later visitation
      			storedMove = adjacentTiles[i];
				  }
				  if (!storedMove) {
				  	//we have already visited every adjacent tile...what now?
            storedMove = adjacentTiles[i]
				  }
       	}
				//move the player
        this.myMap.player.queue.push(['Move', storedMove]);
      } else if (totalSenses.length !== 0 && adjacentTiles.length) {
        //see if we can make a route to the gold?
        if (this.history[this.time].gold.length) {
          console.log('GOLD FOUND')
         
          if (this.myMap.player.gold) {
            this.getOut();
            return
          }
          if (adjacentTiles.indexOf(this.history[this.time].gold[0])) {
            
            var goTo = adjacentTiles[adjacentTiles.indexOf(this.history[this.time].gold[0])];
            console.log(goTo)
            this.myMap.player.queue.push(['Move', goTo])
            this.myMap.player.queue.push(['Take', goTo])
            return
          }
          //generate a tilemap that fits the mental tilemap we construct for our history of safe tiles
          //can we make a path (aStar) with the generated map
          //if theres a path, take it, otherwwise..keep exploring?
          var startTile = this.myMap.player,
              endTile = this.history[this.time].gold[0],
              tileMap = this.generateTileMap(startTile, endTile);
              tileMap.endCol = endTile.col;
              tileMap.endRow = endTile.row;
          var path = aStar({
               'start': startTile, 
               'end':endTile,
               'gameState': tileMap
              }).finalPath;
          if (path) {
            path.reverse();
            for (var i = 0; i < path.length; i += 1) {
              if (i === path.length - 1) {
                this.myMap.player.queue.push(['Take', path[i]]);
              } else {
                this.myMap.player.queue.push(['Move', path[i]]);
              }
            }
            return;
          }
        }
        //if one of our adjacent tiles is safe and has not been visited, go there
        for (var i = 0; i < adjacentTiles.length; i += 1) {
          if (this.history[this.time].visitedTiles.indexOf(adjacentTiles[i]) === -1 &&
              this.history[this.time].safeTiles.indexOf(adjacentTiles[i]) !== -1) {
            this.myMap.player.queue.push(['Move', adjacentTiles[i]]);
            return;
          }
        }
        //if any safe tiles haven not been visited, make your way  to that unvisited safe tile
        for (var i = 0; i < this.history[this.time].safeTiles.length; i += 1) {
          if (this.history[this.time].visitedTiles.indexOf(this.history[this.time].safeTiles[i]) === -1) {
            //create path to tile we want to visit
            var tileMap = this.generateTileMap(this.myMap.player, this.history[this.time].safeTiles[i]);
            var endTile = this.history[this.time].safeTiles[i];
            tileMap.endCol = endTile.col;
            tileMap.endRow = endTile.row;
            console.log(tileMap)
            var path = aStar({
              'start': this.myMap.player, 
              'end': this.history[this.time].safeTiles[i], 
              'gameState': tileMap
            }).finalPath;
          
            path.reverse();
            console.log('Follow path from ' + this.myMap.player.col + ', ' + this.myMap.player.row)
            
            console.log(path)
            for (var i = 0; i < path.length; i += 1) {
              this.myMap.player.queue.push(['Move', path[i]]);
            }
            return;
          }
        }
        if (this.history[this.time].monsters.length && this.myMap.player.ammo) {
          //we need to shoot
          var adjacentTilesToMonster = this.myMap.getAdjacentTiles(this.history[this.time].monsters[0].col, this.history[this.time].monsters[0].row);
          for (var i = 0; i < adjacentTilesToMonster.length; i += 1) {
            if (this.history[this.time].safeTiles.indexOf(adjacentTilesToMonster[i]) !== -1) {
              var tileMap = this.generateTileMap(this.myMap.player, adjacentTilesToMonster[i]);
              tileMap.endCol = endTile.col;
              tileMap.endRow = endTile.row;

              var path = aStar({
                'start': this.myMap.player, 
                'end':  adjacentTilesToMonster[i], 
                'gameState': tileMap
              }).finalPath;
            path.reverse();
            for (var i = 0; i < path.length; i += 1) {
              if (i === path.length - 1) {
                this.myMap.player.queue.push(['Shoot', this.history[this.time].monsters[0]]);
              } else {
                this.myMap.player.queue.push(['Move', path[i]]);
              }
            }
            return;
            }
          }
        }
        if (this.history[this.time].possibleMonsters.length && this.myMap.player.ammo) {
          //we need to take a chance and shoot
          var adjacentTilesToMonster = this.myMap.getAdjacentTiles([this.history[this.time].possibleMonsters[0].col][this.history[this.time].possibleMonsters[0].row]);
          for (var i = 0; i < adjacentTilesToMonster.length; i += 1) {
            if (this.history[this.time].safeTiles.indexOf(adjacentTilesToMonster[i]) !== -1) {
              var tileMap = this.generateTileMap(this.myMap.player, adjacentTilesToMonster[i]);
                tileMap.endCol = endTile.col;
                tileMap.endRow = endTile.row; 
              var path = aStar({
                'start': this.myMap.player, 
                'end': adjacentTilesToMonster[i], 
                'gameState': this.generateTileMap(this.myMap.player, adjacentTilesToMonster[i])
              }).finalPath;
            path.reverse();
            for (var i = 0; i < path.length; i += 1) {
              if (i === path.length - 1) {
                this.myMap.player.queue.push(['Shoot', this.history[this.time].possibleMonsters[0]]);
              } else {
                this.myMap.player.queue.push(['Move', path[i]]);
              }           
            }
            return;
            }
          }
        }       
        console.log('IMPOSSIBLE TO WIN');
      }
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
        'ladder': []
      }
      that.over = false;
      that.observe()
    return that;
  }

  return function (OO) {
  	return init(Object.create(logicProto).extend(OO));
  }

}());