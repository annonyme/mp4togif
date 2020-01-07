importScripts('./NeuQuant.js');
importScripts('./ownImpl.js');

self.addEventListener('message', function(event) {
	var edata=event.data;
	
	//------------
	
	delay=edata.delay|0;
	var data=null;
	if(edata.isImage){
		var canvas=document.createElement("canvas");
		canvas.width=edata.width|0;
		canvas.height=edata.height|0;
		var context = canvas.getContext('2d');
		
		context.drawImage(edata.frame,0|0,0|0,edata.width|0,edata.height|0);

		data=context.getImageData(0|0,0|0,context.canvas.width|0,context.canvas.height|0).data;
	}
	else{
		data = edata.frame.data;
	}
	
    // Make palette with NeuQuant.js
    var nqInPixels = rgba2rgb(data, edata.matte, edata.transparent);
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

    //handle transparencie
    if (thereAreTransparentPixels) {
	  options.transparent = nq.map(transparent[0], transparent[1], transparent[2]);
      if(edata.data.compressed){
    	  options.disposal = 1; // hold previous frame in background
      }
      else{
    	  options.disposal = 2; // Clear between frames
      }	  
    }
	
	//------------
	
	self.postMessage({
						index:edata.index,
						map:map,
						options:options,
						height:edata.height,
						width:edata.width
					});
	self.close();
},false);