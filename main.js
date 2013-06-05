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