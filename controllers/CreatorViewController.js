function CreatorViewController(){
	this.selectedController="video";
	
	this.asynchronGif=true;
	this.asynchronFilters=false;
				
	this.width=240;
	this.height=180;
	this.format="webm";
	this.filter="";
	this.vig="-";
	this.animationFilter="-";
	this.addWatermark=false;
	this.fps=6;
	
	this.ratio=320/240;
	this.webpSupport=false;
	
	this.encoderWebP = new WebPEncoder();
	
	this.filters=new Filters();
	
	this.setVideoResolution=function(width, height){
		if(width>0 && height>0){
			this.width=width;
			this.height=height;
			this.cjsPushBindings();
		}		
	};
				
	this.makeIt=function(event){
		var ad = document.querySelector("ins.adsbygoogle");
		if (ad && ad.innerHTML.replace(/\s/g, "").length == 0) {
			console.log("add watermark");
			this.addWatermark=true;
		}
		else{
			console.log("no watermark");
		}
		
		this.cjsGetController("wait").open("Capturing images...");
		
		var canvas=document.createElement("canvas");
		canvas.width=20;
		canvas.height=20;
		var ctx=canvas.getContext("2d");
		ctx.fillStyle="#000000";
		ctx.fillRect(0,0,20,20);
		this.webpSupport=ctx.canvas.toDataURL("image/webp").match(/image\/webp/)!=null;
		this.cjsPullBindings();
		this.configWebMEncoder();

		//call getImageList by source controller
		var func=function(controller){
			return function(images){
				controller.create(images);
			};
		};
		console.log("request images from source-controller ("+this.selectedController+"): "+this.fps+"fps, "+this.width+"x"+this.height);
		this.cjsGetController(this.selectedController).getImageList(this.fps,this.width,this.height,func(this));
		return false;
	};
	
	this.encoder=null;
	this.webpResults=[];
	this.webpResultCount=0;
	this.rendering=-1;
	
	//method is used as callback func for getImageList-Methods
	//it applies filters or redirect direcltly to renderOutput-method
	this.create=function(imgList){
		if(imgList && imgList.length>0){			
			if((this.filter && this.filter.length>0) || (this.vig && this.vig.length>1) || this.addWatermark){
				if(this.asynchronFilters && !this.addWatermark && this.vig!="vig"){
					var callBackFilter=function(controller){
						return function(iL){
							iL=controller.filters.renderAnimation(controller.animationFilter, iL);
							controller.createOutput(iL);
						};
					};
					this.cjsGetController("wait").update("Apply filter '"+this.filter+"' ...");
					console.log("apply filter: "+this.filter+", filter2: "+this.vig);
					this.filters.renderFilterWorkers(imgList,this.filter,this.vig,this.addWatermark,callBackFilter(this));
				}
				else{
					for(var i=0;i<imgList.length;i++){
						imgList[i]=this.filters.render(this.filter,imgList[i],this.vig, this.addWatermark);
					}
					imgList=this.filters.renderAnimation(this.animationFilter, imgList);
					this.createOutput(imgList);
				}				
			}
			else{
				imgList=this.filters.renderAnimation(this.animationFilter, imgList);
				this.createOutput(imgList);
			}
		}
	};
	
	//method created real output after applied filters or not...
	this.createOutput=function(imgList){
		if(imgList && imgList.length>0){			
			this.cjsGetController("wait").update("Rendering images...");
			console.log("create animation: "+this.format+" "+this.width+"x"+this.height);
			//create the file by format
			if(this.format=="webm"){
				this.webpResults=[];
				this.encoder = new Whammy.Video(this.fps);
				
				//called on returned messages from webworker
				var callBack=function(controller){
					return function(event){
						console.log("worker returned webp #"+event.data.index);
						controller.webpResults[event.data.index]=event.data.image;
						controller.cjsGetController("wait").update("Rendering Webp: "+controller.webpResults.length+"/"+controller.webpResultCount);
						if(controller.webpResults.length==controller.webpResultCount && controller.rendering<0){
							controller.rendering=event.data.index;
							console.log("all webps returned");							
							for(var i=0;i<controller.webpResults.length;i++){
								if(controller.webpResults[i]){
									controller.encoder.add(controller.webpResults[i]);
								}
								else{
									console.log("ERROR: image #"+i+" is missing!");
								}
							}
							
							if(controller.rendering==event.data.index  && controller.webpResults.length > 0){
								controller.runEncodingWebM();
							}
							else{
								console.log("runEncodingWebM blocked for this callback"); //TODO??? remove
							}							
						}
					};
				};
				
				this.webpResultCount=imgList.length;
				for(var i=0;i<imgList.length;i++){
					var ctx=imgList[i];
					if(this.webpSupport){
						this.encoder.add(ctx.canvas.toDataURL("image/webp"));
					}
					else{
						//render webp with webworker is not supported by canvas
						var worker = new Worker('./controllers/webpWorker.js');
						worker.addEventListener('message', callBack(this), false);
						console.log("worker #"+i+" was created.");
						var postData={
							index:i,
							width:ctx.canvas.width,
							height:ctx.canvas.height,
							webpSupport:false,
							imagedata:ctx.getImageData(0|0, 0|0, ctx.canvas.width|0, ctx.canvas.height|0).data
						};					
						worker.postMessage(postData);
					}
				}

				if(this.webpSupport){
					this.runEncodingWebM();
				}
			}
			else{
				//create a gif
				this.cjsGetController("wait").update("Rendering images...");
				this.rendering=1;
				var frames=[];
				for(var i=0;i<imgList.length;i++){					
					var ctx=imgList[i];
					var frame=new GifFrame();				
					frame.img=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
							
					//Delay in hundredths of a sec: (100=1s, 10=0.1s.. 100ms=0.1s=10=msValue/10 )
					frame.delay=Math.round(parseInt(1/this.fps*100));					
					frames[frames.length]=frame;
					console.log("add frame for gif ("+i+")");
					this.cjsGetController("wait").update("Rendering images ("+i+"/"+imgList.length+")");
				}
				
				//render gif with webworkers
				if(this.asynchronGif){					
					if(frames.length>0){
						this.cjsGetController("wait").update("Rendering Gif...");
						var callBack=function(controller){
							return function(gifDataURI){
								console.log("gif created!");
								controller.cjsGetController("preview").open(gifDataURI,"gif");
								controller.cjsGetController("wait").close();
								controller.rendering=-1;
							};
						};
						
						//render with workers
						renderFramesWorker(
								{
									delay:parseInt(1/this.fps*100),
									frames:frames,
									height:parseInt(this.height),
									width:parseInt(this.width),
									isimages:false,
									transparent: [255,0,255]
								},false, callBack(this)
							);
					}
				}
				else{
					//old style rendering without webworkers
					try{
						this.cjsGetController("wait").update("Final Step: Rendering Gif...");
						if(frames.length>0){				
							console.log("start rendering gif ("+frames.length+" frames)");
							var uri=renderFrames(
									{
										delay:parseInt(1/this.fps*100),
										frames:frames,
										height:parseInt(this.height),
										width:parseInt(this.width),
										isimages:false,
										transparent: [255,0,255]
									},false
								);
							console.log("gif created!");
							this.cjsGetController("preview").open(uri,"gif");
						}
						this.cjsGetController("wait").close();
					}
					catch(e){
						console.log(e);
						this.cjsGetController("wait").close();
						this.cjsGetController("warn").open("Error on rendering Gif ("+e.message+")!");
					}
					this.rendering=-1;
				}								
			}
		}
	};
	
	/**
	 * create WebM with encoder and open in preview-dialog
	 */
	this.runEncodingWebM=function(){
		this.cjsGetController("wait").update("Rendering WebM...");
		console.log("start compiling webm");
		try{
			var output = this.encoder.compile();
			var url = (window.webkitURL || window.URL).createObjectURL(output);
		}
		catch(e){
			console.log(e);
			this.cjsGetController("warn").open("Error on rendering WebM ("+e.message+")!");
		}		
		console.log("finish compiling webm");
		this.cjsGetController("wait").close();	
		this.rendering=-1;
		this.cjsGetController("preview").open(url,"video");		
	};	
	
	/**
	 * set configs to WebM-Encoder
	 */
	this.configWebMEncoder=function(){
		//Config, you can set all arguments or what you need, nothing no objeect 
		var 
		config = new Object();
		config.target_size = 0|0;			// if non-zero, set the desired target size in bytes. Takes precedence over the 'compression' parameter.
		config.target_PSNR = 0.;			// if non-zero, specifies the minimal distortion to	try to achieve. Takes precedence over target_size.
		config.method = 0|0;				// quality/speed trade-off (0=fast, 6=slower-better)
		config.sns_strength = 50|0;			// Spatial Noise Shaping. 0=off, 100=maximum. Default 50
		config.filter_strength = 20|0; 		// range: [0 = off .. 100 = strongest] Default: 20
		config.filter_sharpness = 0|0;		// range: [0 = off .. 7 = least sharp]
		config.filter_type = 0|0;			// filtering type: 0 = simple, 1 = strong (only used if filter_strength > 0 or autofilter > 0)
		config.partitions = 0|0;			// log2(number of token partitions) in [0..3] Default is set to 0 for easier progressive decoding.
		config.segments = 1|0;				// maximum number of segments to use, in [1..4] Default:4
		config.pass = 1|0;					// number of entropy-analysis passes (in [1..10]).
		config.show_compressed = 0|0;		// if true, export the compressed picture back. In-loop filtering is not applied.
		config.preprocessing = 0|0;			// preprocessing filter (0=none, 1=segment-smooth)
		config.autofilter = 0|0;			// Auto adjust filter's strength [0 = off, 1 = on]
		config.partition_limit = 0|0;
											//  --- description from libwebp-C-Source Code --- 
		config.extra_info_type = 0|0;		// print extra_info Default:2
		config.preset = 0|0; 				// 0: default, 1: picture, 2: photo, 3: drawing, 4: icon, 5: text
		
		//----------
		this.encoderWebP.WebPEncodeConfig(config);
	};
}