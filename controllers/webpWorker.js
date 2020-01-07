importScripts('../lib/libwebp-0.1.3.demin.js');
self.addEventListener('message', function(event) {
  //"use asm";
  var data=event.data;
  var encoderWebP = new WebPEncoder();
  
		var config = new Object();
		config.target_size = 0|0;			// if non-zero, set the desired target size in bytes. Takes precedence over the 'compression' parameter.
		config.target_PSNR = 0.;		// if non-zero, specifies the minimal distortion to	try to achieve. Takes precedence over target_size.
		config.method = 0|0;				// quality/speed trade-off (0=fast, 6=slower-better)
		config.sns_strength = 50|0;		// Spatial Noise Shaping. 0=off, 100=maximum. Default 50
		config.filter_strength = 20|0; 	// range: [0 = off .. 100 = strongest] Default: 20
		config.filter_sharpness = 0|0;	// range: [0 = off .. 7 = least sharp]
		config.filter_type = 0|0;			// filtering type: 0 = simple, 1 = strong (only used if filter_strength > 0 or autofilter > 0)
		config.partitions = 0|0;			// log2(number of token partitions) in [0..3] Default is set to 0 for easier progressive decoding.
		config.segments = 1|0;			// maximum number of segments to use, in [1..4] Default:4
		config.pass = 1|0;				// number of entropy-analysis passes (in [1..10]).
		config.show_compressed = 0|0;		// if true, export the compressed picture back. In-loop filtering is not applied.
		config.preprocessing = 0|0;		// preprocessing filter (0=none, 1=segment-smooth)
		config.autofilter = 0|0;			// Auto adjust filter's strength [0 = off, 1 = on]
		config.partition_limit = 0|0;
										//  --- description from libwebp-C-Source Code --- 
		config.extra_info_type = 0|0;		// print extra_info Default:2
		config.preset = 0|0; 				// 0: default, 1: picture, 2: photo, 3: drawing, 4: icon, 5: text
		
		//----------
		encoderWebP.WebPEncodeConfig(config);
		
		var imgdata=data.imagedata;
		var w=data.width;
		var h=data.height;
		var webpSupport=data.webpSupport;
		var i=data.index;

		var out={output:''};
		var size = encoderWebP.WebPEncodeRGBA(imgdata, w|0, h|0, (w*4)|0, 75|0, out);		
		var result="data:image/webp;base64,"+btoa(out.output);
	
    self.postMessage({index:i,image:result});
	self.close();
}, false);