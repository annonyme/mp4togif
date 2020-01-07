// |0 int
// +n float

var thereAreTransparentPixels = false;

function GifFrame(){
	this.img=null;
	this.delay=100|0;
};

function makeDataURI (strData, strMime) {
    return "data:" + strMime + ";base64," + strData;
};

function encodeData(data) {
    var strData = "";
    if (typeof data == "string") {
        strData = data;
    } else {
        var aData = data;
        var dLength=aData.length;
		for (var i=0|0;i<dLength;i++) {
            strData += String.fromCharCode(aData[i]);
        }
    }
    return btoa(strData);
};

function rgba2rgb(data, matte, transparent) {
  var pixels = [];
  var count = 0|0;
  var len = data.length|0;
  for ( var i=0|0; i<len; i+=4|0 ) {
    var r = data[i]|0;
    var g = data[i+1]|0;
    var b = data[i+2]|0;
    var a = data[i+3]|0;
    if (transparent && transparent.length>0|0 && a===0) {
      // Use transparent color
      r = transparent[0]|0;
      g = transparent[1]|0;
      b = transparent[2]|0;
      thereAreTransparentPixels = true;
    } else if (matte && a<255) {
      // Use matte with "over" blend mode
      r = ( (r*a + (matte[0] * (255-a))) / 255 ) |0;
      g = ( (g*a + (matte[1] * (255-a))) / 255 ) |0;
      b = ( (b*a + (matte[2] * (255-a))) / 255 ) |0;
    }
    pixels[count++] = r;
    pixels[count++] = g;
    pixels[count++] = b;
  }
  return pixels;
};

function rgb2num(palette) {
  var colors = [];
  var count = 0|0;
  var len = palette.length|0;
  for ( var i=0|0; i<len; i+=3|0 ) {
    colors[count++] = palette[i+2] | (palette[i+1] << 8) | (palette[i] << 16);
  }
  return colors;
};

//data == imageData
function quant(data,matte,transparent){
	// Make palette with NeuQuant.js
    var nqInPixels = rgba2rgb(data, matte, transparent);
    var len = nqInPixels.length;
    var nPix = len / 3;
    var map = [];
    var nq = new NeuQuant(nqInPixels, len, 10);
    // initialize quantizer
    var paletteRGB = nq.process(); // create reduced palette
    var palette = rgb2num(paletteRGB);
    // map image pixels to new palette
    var k = 0|0;
    for (var j = 0|0; j < nPix; j++) {
      var index = nq.map(nqInPixels[k++] & 0xff, nqInPixels[k++] & 0xff, nqInPixels[k++] & 0xff);
      // usedEntry[index] = true;
      map[j] = index;
    }
	
	alert(map.length);
	
	return {
		index:map,
		palette:palette
	};
}

//replace the parts of the image, that doesn't have change with die transparent-color
function compress(data, lastImageData, transparentColor){
	if(lastImageData && data.length==lastImageData.length){
		for(var i;i<data.length;i=i+4){
			if(data[i]==lastImageData[i] && data[i+1]==lastImageData[i+1] && data[i+2]==lastImageData[i+2]){
				data[i]=transparentColor[0];
				data[i+1]=transparentColor[1];
				data[i+2]=transparentColor[2];
			}
		}
	}	
	return data;
}

var imgCtxCache=null;

function addFrame(frame,gifWriter,isImage,matte,transparent,delay,width,height,compressed) {
	delay=delay|0;
	var data=null;
	if(isImage){
		var context=imgCtxCache;
		if(!context){
			var canvas=document.createElement("canvas");
			canvas.width=width|0;
			canvas.height=height|0;
			context = canvas.getContext('2d');
			imgCtxCache=context;
		}
		else{
			context.clearRect(0|0,0|0,width|0,height|0);
		}
		
		context.drawImage(frame,0|0,0|0,width|0,height|0);

		data=context.getImageData(0|0,0|0,context.canvas.width|0,context.canvas.height|0).data;
	}
	else{
		data = frame.data;
	}
	
    // Make palette with NeuQuant.js
    var nqInPixels = rgba2rgb(data, matte, transparent);
    var len = nqInPixels.length|0;
    var nPix = len / 3;
    var map = [];
    var nq = new NeuQuant(nqInPixels, len, 10);
    // initialize quantizer
    var paletteRGB = nq.process(); // create reduced palette
    var palette = rgb2num(paletteRGB);
    // map image pixels to new palette
    var k = 0|0;
    for (var j = 0|0; j < nPix; j++) {
      var index = nq.map(nqInPixels[k++] & 0xff, nqInPixels[k++] & 0xff, nqInPixels[k++] & 0xff);
      map[j] = index;
    }

    var options = { palette: new Uint32Array( palette ), delay: delay };

    if (thereAreTransparentPixels) {
	  options.transparent = nq.map(transparent[0], transparent[1], transparent[2]);
	  if(compressed){
		  options.disposal = 1; // hold previous frame in background
	  }
	  else{
		  options.disposal = 2; // Clear between frames
	  }      
    }
	
	//debug
	/*
	for(var i=0;i<options.palette.length;i++){
		//palette[i+2] | (palette[i+1] << 8) | (palette[i] << 16)
		var r=palette[i]>>16;
		var g=palette[i]>>8 & 0xFF;
		var b=palette[i] & 0xFF;
		
		var span=document.createElement("span");
		span.setAttribute("style","color:rgb("+r+","+g+","+b+");");
		span.appendChild(document.createTextNode(i+": "+options.palette[i]));
		document.getElementById("debug").appendChild(span);
		document.getElementById("debug").appendChild(document.createElement("br"));
	}
	
	
	var canvas=document.getElementById("canvas");
	var context = canvas.getContext('2d');
	for(var y=0;y<64;y++){
		for(var x=0;x<64;x++){
			var color=palette[map[x*64+y]];
			
			var r=color>>16;
			var g=color>>8 & 0xFF;
			var b=color & 0xFF;
			
			context.fillStyle="rgb("+r+","+g+","+b+")";
			context.fillRect(x,y,x+1,y+1);
		}
	}
	*/

    gifWriter.addFrame( 0|0, 0|0, width|0, height|0, new Uint8Array( map ), options );
};


//return gif as dataURI
function renderFrames(data,asBlob){
	var frames = data.frames;
	var delay = data.delay|0;
	var height=data.height|0;
	var width=data.width|0;
	var compressed=data.compressed ? true : false;

	var matte = data.matte ? data.matte : [255,255,255];
	var transparent = data.transparent ? data.transparent : false;
	var isImages= data.isimages ? data.isimages : false;

	var buffer=[];
	var gif = new GifWriter( buffer, width|0, height|0, { loop: 0 } );
	
	var len=frames.length|0;
	for (var i = 0|0; i<len; i++) {
		if(frames[i].delay==0|0){
			frames[i].delay=delay;
		}
		
		//imageData , reduce image-informations with previous image-informations
		if(compressed && i>0){
			frames[i].img.data=compress(frames[i].img.data, frames[i-1].img.data, transparent);
		}
		
		addFrame(frames[i].img,gif,isImages,matte,transparent,frames[i].delay|0,width|0,height|0, (compressed && i>0));    
	}
	
	var binary_gif=buffer.slice(0, gif.end());
	return makeDataURI(encodeData(binary_gif),"image/gif");
}

/**
 * Same as above but works with WebWorkers
 * @param data
 * @param asBlob
 * @param callBackFunction
 */
function renderFramesWorker(data,asBlob,callBackFunction){
	var frames = data.frames;
	var delay = data.delay|0;
	var height=data.height|0;
	var width=data.width|0;

	var matte = data.matte ? data.matte : [255,255,255];
	var transparent = data.transparent ? data.transparent : false;
	var isImages= data.isimages ? data.isimages : false;

	var buffer=[];
	var gif = new GifWriter( buffer, width|0, height|0, { loop: 0 } );
	var counter=0;
	var len=frames.length|0;
	var cache=[];
	var rendering=false;
	
	var func=function(gifWriter,callBack,cacheA){
		return function(event){
			var edata=event.data;
			cacheA[edata.index]=edata;
			console.log("gifWorker returned data ("+(edata.index)+" : "+cacheA.length+")");
			if(cacheA.length==len){
				if(!rendering){
					rendering=true;
					for(var i=0;i<cacheA.length;i++){
						if(cacheA[i]){
							var ed=cacheA[i];
							gif.addFrame( 0|0, 0|0, ed.width|0, ed.height|0, new Uint8Array( ed.map ), ed.options );
						}				
					}
					
					if(rendering){
						var binary_gif=buffer.slice(0, gif.end());				
						callBack(makeDataURI(encodeData(binary_gif),"image/gif"));
					}					
					rendering=false;
				}				
			}
		}
	};	
	
	for (var i = 0|0; i<len; i++) {
		if(frames[i].delay==0|0){
			frames[i].delay=delay;
		}
		
		var worker = new Worker('./lib/gifWorker.js');
		worker.addEventListener('message', func(gif,callBackFunction,cache), false);
		console.log("gif-worker #"+i+" was created.");
		var postData={
			width:width,
			height:height,
			delay:frames[i].delay,
			isImage:isImages,
			matte:matte,
			frame:frames[i].img,
			transparent:transparent,
			index:i
		};					
		worker.postMessage(postData);    
	}
}