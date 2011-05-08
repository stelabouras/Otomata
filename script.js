/*
Otomata is an HTML5 version of the awesome flash music generator by @earslap

http://www.earslap.com/projectslab/otomata
*/

window.ios = window.navigator.userAgent.indexOf('AppleWebKit') !== -1 && window.navigator.userAgent.indexOf('Mobile') !== -1;

/* Taken from: http://paulirish.com/2011/requestanimationframe-for-smart-animating/ */
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       || 
            window.webkitRequestAnimationFrame || 
            window.mozRequestAnimationFrame    || 
            window.oRequestAnimationFrame      || 
            window.msRequestAnimationFrame     || 
            function(callback, element) {
           		window.setTimeout(callback, 1000 / 60);
            };
})();

/* Taken from: http://www.webtoolkit.info/javascript-base64.html */
var Base64 = {
 
	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = Base64._utf8_encode(input);
 
		while (i < input.length) {
 
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 
			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
		}
 
		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
		while (i < input.length) {
 
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
 
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
 
			output = output + String.fromCharCode(chr1);
 
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
 
		}
 
		output = Base64._utf8_decode(output);
 
		return output;
 
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
 
		for (var n = 0; n < string.length; n++) {
 
			var c = string.charCodeAt(n);
 
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
 
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = 0;
		var c1 = 0;
		var c2 = 0;
 
		while ( i < utftext.length ) {
 
			c = utftext.charCodeAt(i);
 
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 
		}
 
		return string;
	} 
};

function Cell(x, y, o) {

	this.x 	= x || 0;
	this.y 	= y || 0;
	this.o 	= o || 1; //Orientation: 1 up, 2 right, 3 down, 4 left
}

Cell.prototype.toggleOrientation = function() {

	switch(this.o) {

		case 1 :
			this.o = 3;
		break;

		case 2 :
			this.o = 4;
		break;

		case 3 :
			this.o = 1;
		break;

		case 4 :
			this.o = 2;
		break;
	}
};

Cell.prototype.turnClockWise = function() {  this.o = (this.o == 4 ? 1 : this.o + 1); };

Otomata = new function() {
	
	var divisions 	= 9;
	var frameCount 	= 0;
	var tick 		= 0;
	
	var highLines	= [];
	var highRows	= [];
	var cells 		= [];
	var sounds		= [];
	
	var animating 		= false;
	var projectedMoves 	= {};
	var animationStep 	= 0;
	
	var canvas;
	var context;
	
	var mouse = {
		x : 0,
		y : 0
	};
	
	var world = {
		width : 500,
		height: 500
	};
	
	// calculate the division dimensions based on world dimensions
	// and the number of divisions
	var divWidth 	= world.width / divisions;
	var divHeight 	= world.height / divisions;				
	
	// Initialization of the world, events and animation loop
	this.initialize = function() {
		
		var html = [];
		
		html.push('<canvas id="world" width="' + world.width + '" height="' + world.height + '">');
		html.push('Your browser does not support canvas element :( Sorry');
		html.push('</canvas>');
		
		$('#main').append(html.join(''));
		
		html = [];
		
		html.push('<p>');
		html.push('<button onclick="Otomata.toggleAnimation();">Play / Pause (space)</button>');
		html.push(' - ');
		html.push('<button onclick="Otomata.clearCells();">Clean (c)</button>');
		html.push('</p>');
		html.push('<p><textarea id="link" cols="130" rows="1" onclick="Otomata.stopAnimation();this.select();"></textarea></p>');
		
		$('#main').append(html.join(''));
		
		html = [];
		
		var a 	= document.createElement('audio');
		var ext	= '';
		
		if(!!(a.canPlayType && a.canPlayType('audio/mpeg;').replace(/no/, '')))
			ext = 'mp3';
		else if(!!(a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"').replace(/no/, '')))
			ext = 'ogg';
			
		for(var i = 0; i < divisions; i++) 
			html.push('<audio preload="auto" id="tone-' + i + '" src="http://dl.dropbox.com/u/20485/otomata/sounds/' + i + '.' + ext + '"></audio>');
		
		$('#main').append(html.join(''));
		
		canvas	= $('#world')[0];
		context = canvas.getContext('2d');
		
		animationStep = (window.ios ? 6 : 12);
		
		if(!window.ios) {
			
			document.addEventListener('keydown', function(event) {
			
				// space for pause/play
				if(event.keyCode == 32) {
				
					event.preventDefault();
				
					Otomata.toggleAnimation();
				}
			
				// c for clear
				if(event.keyCode == 67 && event.metaKey == false && event.ctrlKey == false)
					Otomata.clearCells();
			
			}, false);

			document.addEventListener('mousemove', function(event) {
			
				mouse.x = (event.clientX > world.width ? world.width : event.clientX);
				mouse.y = (event.clientY > world.height? world.height: event.clientY);
			
			}, false);
			
			canvas.addEventListener('mousedown', function(event) {

				if (event.target == canvas) {

					event.preventDefault();

					var col 	= parseInt(mouse.x / divWidth);
					var row 	= parseInt(mouse.y / divHeight);

					col = (col > divisions - 1 ? divisions - 1 : col);
					row = (row > divisions - 1 ? divisions - 1 : row);
					
					Otomata.addCell(col, row);
				}

			}, false);
			
		} else {
			
			canvas.addEventListener('touchstart', function(event) {
			
				if(event.touches.length == 1) {
				
					event.preventDefault();

					mouse.x = (event.touches[0].pageX > world.width ? world.width : event.touches[0].pageX);
					mouse.y = (event.touches[0].pageY > world.height? world.height: event.touches[0].pageY);

					var col 	= parseInt(mouse.x / divWidth);
					var row 	= parseInt(mouse.y / divHeight);

					Otomata.addCell(col, row);
				}
			
			}, false);
		}
		
		readHash();
		animateWorld();
	};
	
	this.toggleAnimation 	= function() { animating = !animating; }
	this.stopAnimation		= function() { animating = false; }
	this.clearCells			= function() { 
		
		cells 		= []; 
		highLines	= [];
		highRows	= [];

		this.stopAnimation();
	}
	
	this.generateLink		= function() {
	
		if(cells.length == 0)
			return;
		
		var hash = Base64.encode(JSON.stringify(cells));
		var link = window.location.origin + window.location.pathname + '#cells=' + hash;
		
		$('#link').html(link).show();
	}
	
	this.addCell = function(col, row) {
		
		var exists 	= false;
		
		// check if we hit a cell
		for(var i = 0; i < cells.length; i++) {
			
			var cell = cells[i];
			
			if(cell.x == col && cell.y == row) {
				
				exists = true;
				
				// cycle through the orientation of cell, or remove it
				if(cell.o == 4)
					cells.splice(i, 1);
				else
					cell.turnClockWise();
					
				break;
			}
			
		}
		
		if(!exists)
			cells.push(new Cell(col, row));
			
		Otomata.generateLink();
	}
	
	function readHash() {
		
		var hash = window.location.hash;
		
		if(hash.indexOf('cells=') == -1)
			return;
			
		var icells = JSON.parse(Base64.decode(hash.split(/cells=/)[1]));
		
		if(icells && icells.length && icells.length > 0) {
			
			for(var i = 0; i < icells.length; i++)
				cells.push(new Cell(icells[i].x, icells[i].y, icells[i].o));
		}
		
		Otomata.generateLink();
	}
	
	function animateWorld() {

		requestAnimFrame(animateWorld, canvas);
		
		tick = (frameCount++ % animationStep);

		if(animating)
			moveCells();
			
		buildWorld();
	}
	
	function moveCells() {
	
		// cell animation runs in 15 fps
		if(tick != 0)
			return;

		highLines	= [];
		highRows 	= [];
	
		// collision detection and response
		
		// projectedMoves in an object that holds every x-y of the projected 
		// position with the cells in that particular position
		projectedMoves 	= {};	
		
		// projectedIndices is the array of new positions
		var projectedIndices= [];
			
		for(var i = 0; i < cells.length; i++) {
	
			var cell	= cells[i];
			var prIndex;
			
			// collision checks with walls
			if( (cell.x == divisions - 1 && cell.o == 2) ||
				(cell.x == 0 && cell.o == 4) ||
				(cell.y == 0 && cell.o == 1) ||
				(cell.y == divisions - 1 && cell.o == 3) ) {

				var toneIndex = 0;
				
				if(cell.o == 1 || cell.o == 3) {
					
					toneIndex 	= cell.x;
					
					highRows.push(cell.x);
					
				} else {
				
					toneIndex 	= divisions - 1 - cell.y;
					highLines.push(cell.y);
				}
				
				var toneElement = $('#tone-' + toneIndex)[0];
				
				if(toneElement.readyState == 4) {
					
					toneElement.currentTime = 0;
					toneElement.play();
				}
				
				cell.toggleOrientation();
			}
			
			if(cell.o == 1)
				prIndex = 'x' + cell.x + 'y' + (cell.y - 1);
			if(cell.o == 2)
				prIndex = 'x' + (cell.x + 1) + 'y' + cell.y;
			if(cell.o == 3)
				prIndex = 'x' + cell.x + 'y' + (cell.y + 1);
			if(cell.o == 4)
				prIndex = 'x' + (cell.x - 1) + 'y' + cell.y;

			projectedMoves[prIndex] = projectedMoves[prIndex] || [];
			projectedMoves[prIndex].push(cell);
			
			if(projectedMoves[prIndex].length == 1)
				projectedIndices.push(prIndex);
		}
		
		for(var i = 0; i < projectedIndices.length; i++) {
			
			var index = projectedIndices[i];
			var prMove= projectedMoves[index];
			
			for(var j = 0; j < prMove.length; j++) {
			
				var cell = prMove[j];

				if(cell.o == 1)
					cell.y--;
				if(cell.o == 2)
					cell.x++;
				if(cell.o == 3)
					cell.y++;
				if(cell.o == 4)
					cell.x--;
				
				// if more than 1 cell in a position
				// then we have a collision, so we turn
				// those cells clockwise
				if(prMove.length > 1)	
					cell.turnClockWise();
			}
		}
		
		Otomata.generateLink();
	}

	function buildWorld() {

		// set the background color
		context.fillStyle = "#2D2932";
		context.fillRect(0, 0, world.width, world.height);
		
		// Draw the background cells
		for(var i = 0; i < divisions; i++) {
			
			for(var j = 0; j < divisions; j++) {
				
				context.save();
				
				context.translate(i * divWidth , j * divHeight);
					
				if(highRows.indexOf(i) !== -1 || highLines.indexOf(j) !== -1 ||
					(mouse.x > i * divWidth && mouse.x < i * divWidth + divWidth - 1 &&
					mouse.y > j * divHeight && mouse.y < j * divHeight + divHeight - 1) )
					context.fillStyle = "#635D69";
				else
					context.fillStyle = "#4C4653";
					
				context.fillRect(1, 1, divWidth - 2, divHeight - 2);
				
				context.restore();
			}
		}
		
		// Draw the cells
		for(var i = 0; i < cells.length; i++) {
			
			var cell	 	= cells[i];
			var collision	= false;
			var hitWall		= false;
			
			if(projectedMoves) {
				
				var projectedMove = projectedMoves['x' + cell.x + 'y' + cell.y];
				
				if(projectedMove && projectedMove.length > 1)
					collision = true;
			}
			
			context.save();
			
			var offsetX = 0;
			var offsetY = 0;
			
			if(animating) {
			
				if(cell.o == 1)
					offsetY -= tick / (animationStep - 1) * divHeight;
				else if(cell.o == 2)
					offsetX += tick / (animationStep - 1) * divWidth;
				else if(cell.o == 3)
					offsetY += tick / (animationStep - 1) * divHeight;
				else
					offsetX -= tick / (animationStep - 1) * divWidth;		
			}
			
			var newPosX = cell.x * divWidth + offsetX;
			var newPosY = cell.y * divHeight + offsetY;
			
			if(newPosX > world.width - divWidth) {
				
				hitWall = true;
				newPosX = world.width - divWidth;
			}
			
			if(newPosY > world.height - divHeight) {
				
				hitWall = true;
				newPosY = world.height - divHeight;
			}
			
			if(cell.x * divWidth + offsetX < 0) {
				
				hitWall = true;
				newPosX = 0;
			}
			
			if(cell.y * divHeight + offsetY < 0) {
				
				hitWall = true;
				newPosY = 0;
			}
			
			context.translate(newPosX, newPosY);

			context.save();
	
			if(collision)
				context.fillStyle = "#FFFFFF";
			else if(mouse.x > cell.x * divWidth && mouse.x < cell.x * divWidth + divWidth - 1 &&
					mouse.y > cell.y * divHeight && mouse.y < cell.y * divHeight + divHeight - 1)
				context.fillStyle = "#EBE5F1";
			else
				context.fillStyle = "#D4CEDB";
			
			context.shadowBlur 	= 15;  
			context.shadowColor = (collision || hitWall ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)");
			context.fillRect(1, 1, divWidth - 2, divHeight - 2);

			context.restore();
						
			//Draw the orientation head
			context.save();
			
			context.fillStyle = "#FFFFFF";
			
			if(cell.o == 2) {
				
				context.translate(divWidth, 0);
				context.rotate(90 * Math.PI / 180);
				
			} else if(cell.o == 3) {
				
				context.translate(divWidth, divHeight);				
				context.rotate(180 * Math.PI / 180);

			} else if(cell.o == 4) {

				context.translate(0, divHeight);					
				context.rotate(270 * Math.PI / 180);
			}
			
			context.beginPath();
			context.moveTo(divWidth / 2, 10);
			context.lineTo(divWidth / 2 + 10, 20);
			context.lineTo(divWidth / 2 - 10, 20);
			context.fill();
			context.closePath();
			
			context.restore();
			
			context.restore();
		}
	}
};

Otomata.initialize();