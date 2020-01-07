function VideoViewController(){
	this.begin=0;
	this.end=0;
				
	this.full=0;
	this.maxTime=20;
	
	this.videoElement=null;
	
	this.fpsInSeconds=0;
	this.captureWidth=0;
	this.captureHeight=0;
	this.captureImages=[];
	this.captureCallback=null;
				
	this.close=function(){
		this.cJSElement.style.display="none";
	};
				
	this.open=function(){
		this.cJSElement.style.display="";
	};
	
	this.capListener=function(controller){
		return function(event){
			controller.grabNextImage();
		};
	};
	
	this.capFunc=null;
				
	this.getImageList=function(fps,width,height,callback){
		this.fpsInSeconds=1/fps;
		this.captureWidth=width;
		this.captureHeight=height;
		this.captureImages=[];
		this.captureCallback=callback;
		
		this.capFunc=this.capListener(this);
		this.videoElement.addEventListener("seeked",this.capFunc,false);
		console.log("start image capture loop");
		var checkBegin=this.begin;
		if(this.begin==0){
			checkBegin=0.1; //chrome doesn't fire event on 0 !!!
		}
		this.videoElement.currentTime=checkBegin;	
	};
	
	this.grabNextImage=function(){
		//after grab set time and listener on time-change ready (canplay)
		if(this.videoElement.currentTime<this.end && this.videoElement.currentTime<this.videoElement.duration){
			console.log("images: "+this.captureImages.length);
			var canvas=document.createElement("canvas");
			canvas.width=this.captureWidth;
			canvas.height=this.captureHeight;
				
			var ctx=canvas.getContext("2d");
			
			//add resource obj
			ctx.drawImage(this.videoElement,0,0,ctx.canvas.width,ctx.canvas.height);
			this.captureImages[this.captureImages.length]=ctx;
			
			this.videoElement.currentTime=this.videoElement.currentTime+this.fpsInSeconds;
		}
		else{
			console.log("return image list("+this.captureImages.length+")");
			this.captureCallback(this.captureImages);
			this.videoElement.removeEventListener("seeked",this.capFunc,false);			
		}
	};
	
	this.openListener=function(controller){
		return function(event){
			controller.init(event);
		};
	};
			
	this.initFunc=null;
			
	this.openFile=function(event){
		var files = event.target.files;
		if(files.length>0){
			var file=files[0];
			
			var funcError=function(controller){
				return function(event){
					console.log("error: unkown videoformat!");
					alert("error: unkown videoformat!");
					//controller.cjsGetController("error").open("Unkown file-format!");
				};
			};
			
			this.videoElement.addEventListener("error",funcError(this),true);
			window.URL = window.URL || window.webkitURL;
			var vUrl=window.URL.createObjectURL(file);
			this.videoElement.src = vUrl;
			
			this.initFunc=this.openListener(this);
			
			this.videoElement.addEventListener("canplaythrough",this.initFunc,false);	
		}
	};
	
	this.init=function(event){
		console.log("-------------- (init video data after loading)");
		this.begin=0;
		this.end=this.begin+this.maxTime;
		if(this.end>Math.round(this.videoElement.duration)){
			this.end=Math.round(this.videoElement.duration);
		}
		this.fullTime();
		
		try{
			console.log("video res: "+this.videoElement.videoWidth+"x"+this.videoElement.videoHeight);
			var factor=this.videoElement.videoWidth/320;
			if(factor!=0){
				var width=Math.round(this.videoElement.videoHeight/factor);
				this.cjsGetController("creator").setVideoResolution(320,width);
			}			
		}
		catch(e){
			console.log(e);
		}		
		
		this.videoElement.removeEventListener("canplaythrough",this.initFunc,false);
		this.cjsPushBindings();
	};
	
	this.fullTime=function(){
		this.full=(this.end-this.begin);
		this.cjsPushBindings();
	};
				
	this.setBegin=function(event){
		if(this.videoElement.currentTime>this.end){
			this.begin=Math.round(this.videoElement.currentTime);
			this.end=this.begin+this.maxTime;
			if(this.end>Math.round(this.videoElement.duration)){
				this.end=Math.round(this.videoElement.duration);
			}
		}
		else{
			this.begin=Math.round(this.videoElement.currentTime);
		}				
		this.fullTime();
	};
				
	this.setEnd=function(event){
		if(this.videoElement.currentTime<this.begin){
			this.begin=this.end;
		}
		this.end=Math.round(this.videoElement.currentTime);
		if(Math.round(this.end-this.begin)>this.maxTime){
			this.end=this.begin+this.maxTime;
		}	
		this.fullTime();		
	};
}