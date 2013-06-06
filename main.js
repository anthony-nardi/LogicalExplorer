require('./extend');

var map = require('./map'),
    logic = require('./logic');

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
  console.log('hi')
  myLogic = logic({
    'myMap' : myMap,
    'map' : myMap.map
  })
  window.logic = logic
  console.log('hii')
}