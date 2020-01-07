function Filters(){
	this.filters=[];

	this.generalRendering=function(idata, rm,gm,bm,ra,ga,ba,greybase){
		var data=idata.data;
		for(var i=0;i<data.length;i+=4){
			if(greybase){
				var avg = (data[i+0]*rm) + (data[i+1]*gm) + (data[i+2]*bm);
				data[i+0]=avg;
				data[i+1]=avg;
				data[i+2]=avg;
			}
			else{
				data[i+0]=data[i+0]*rm;
				data[i+1]=data[i+1]*gm;
				data[i+2]=data[i+2]*bm;
			}
										
			data[i+0]=Math.abs(data[i+0]+parseInt(ra));
			data[i+1]=Math.abs(data[i+1]+parseInt(ga));
			data[i+2]=Math.abs(data[i+2]+parseInt(ba));
		}
		return idata;
	};
	
	this.createVignetting=function(ctx){
		var x=Math.round(ctx.canvas.width/2);
		var y=Math.round(ctx.canvas.height/2);
		var grd=ctx.createRadialGradient(x,y,1,x,y,y-5);
		
		grd.addColorStop(0,'rgba(0,0,0,0)');
		grd.addColorStop(1,'rgba(0,0,0,0.8)');
		
		ctx.fillStyle=grd;
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
		return ctx;
	};
	
	//private helper method
	this.splitToLines=function(idata,width, withError){
		var lineLength=width*4;
		var lines=[];
		var data=idata.data;
		for(var i=0;i<data.length;i++){
			var index=Math.floor(i/lineLength);
			if(withError){
				index=Math.round(i/lineLength);
			}
			if(!lines[index]){
				lines[index]=[];
			}
			lines[index][lines[index].length]=data[i];
		}
		console.log("split lines: "+lines.length + " lastlineLength: " + lines[lines.length-1].length);
		return lines;
	}
	
	this.createLineDisplace=function(ctx, heavy){		
		var idata=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
		idata=this.createLineDisplaceRendering(idata, heavy, ctx.canvas.width);
		ctx.putImageData(idata,0,0);
		return ctx;
	};
	this.createLineDisplaceRendering=function(idata, heavy, width){
		var maxDisplace=5;
		if(heavy){
			maxDisplace=10;
		}
		
		var lines=this.splitToLines(idata,width,false);
		var lineLength=width*4;
		var c=0;
		for(var i=0;i<lines.length;i++){
			var line=lines[i];
			var lineIndex=i*lineLength;
			var displaceLength=Math.floor((Math.random() * maxDisplace) + 0);	
			var first=[];
			for(var j=0;j<4;j++){
				first[j]=line[j];
			}
			
			//displace-left
			for(var j=0;j<(displaceLength*4);j=j+4){
				idata.data[c++] = first[0];
				idata.data[c++] = first[1];
				idata.data[c++] = first[2];
				idata.data[c++] = first[3];
			}
			
			for(var j=0;j<(line.length-(displaceLength*4));j++){
				idata.data[c++] = line[j];
			}
		}
		return idata;
	};
	
	//sat-tv style "fische" (black and white) noise
	this.createFishlies=function(ctx){
		var idata=ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height);
		idata=this.createFishliesRendering(idata, ctx.canvas.width);
		ctx.putImageData(idata,0,0);
		return ctx;
	}	
	this.createFishliesRendering=function(idata, width){
		var lines=this.splitToLines(idata,width,false);
		var lineLength=width*4;
		var maxLength=25;
		var lineLength=width*4;
		var c=0;
		for(var i=0;i<lines.length;i++){
			var line=lines[i];
			var lineIndex=i*lineLength;
			
			var color=50;
			if(Math.floor((Math.random() * 2) + 0) == 1){
				color=200;
			}
			
			if(Math.floor((Math.random() * 5) + 0) == 1){
				var start=Math.floor((Math.random() * width-maxLength) + 0) * 4;
				var length=Math.floor((Math.random() * maxLength) + 0) * 4;
				
				var alpha = 0
				for(j=0;j<line.length && j < lineLength;j++){					
					if(j>=start && j<=(start+length)){
						var col = Math.round(Math.abs(idata.data[lineIndex+j]+(color-j))/2);
						if((alpha+1) % 4 == 0){
							col = line[3];
							console.log(col);
						}
						idata.data[lineIndex+j]=col > 255 ? 255 : col;
						alpha++;
					}
					c++;
				}
			}
		}
		console.log(idata.data.length +":"+c+":"+lines.length+":"+lines[0].length);
		return idata;
	};
	
	this.watermark=null;
	
	this.addWatermark=function(ctx){
		ctx.fillStyle="#FFFFFF";
		ctx.font="13px Arial";
		ctx.fillText("MP4toGIF.com",5,13);
		return ctx;
	};
	
	this.init=function(){
		this.filters["bw"]=function(idata){
			var data=idata.data;
			for(var i=0;i<data.length;i+=4){
				var grayValue=data[i]*0.3+data[i+1]*0.59+data[i+2]*0.11;
				
				data[i]=grayValue;
				data[i+1]=grayValue;
				data[i+2]=grayValue;
				//dont change alpha value [i+4]
			}
			return idata;
		};
		
		this.filters["bw"]=function(idata){
			var data=idata.data;
			for(var i=0;i<data.length;i+=4){
				var grayValue=data[i]*0.3+data[i+1]*0.59+data[i+2]*0.11;
				
				data[i]=grayValue;
				data[i+1]=grayValue;
				data[i+2]=grayValue;
				//dont change alpha value [i+4]
			}
			return idata;
		};

		this.filters["sepia"]=function(idata){
			var data=idata.data;
			for(var i=0;i<data.length;i+=4){
				var grayValue=data[i]*0.3+data[i+1]*0.59+data[i+2]*0.11;
				
				data[i]=grayValue+100;
				data[i+1]=grayValue+50;
				data[i+2]=grayValue+255;
				//dont change alpha value [i+4]
			}
			return idata;
		};
		
		var invFunction=function(controller){
			return function(idata){
				var data=idata.data;
				return controller.generalRendering(idata, 1, 1, 1, -255, -255, -255, false);
			};
		}
		this.filters["invert"]=invFunction(this);
		
		this.filters["vintage"]=function(idata){
			var data=idata.data;
			for(var i=0;i<data.length;i+=4){
				var grayValue=data[i]*0.3+data[i+1]*0.59+data[i+2]*0.11;
				
				data[i]=Math.round((data[i]+grayValue)/2);
				data[i+1]=Math.round((data[i+1]+grayValue)/2);
				data[i+2]=Math.round((data[i+2]+grayValue)/2);
				//dont change alpha value [i+4]
			}
			return idata;
		};
		
		var vint2Function=function(controller){
			return function(idata){
				var data=idata.data;
				return controller.generalRendering(idata, 1, 1, 0.4, -70, -90, 0, false);
			};
		}
		this.filters["vintage2"]=vint2Function(this);
		
		var vint3Function=function(controller){
			return function(idata){
				var data=idata.data;
				return controller.generalRendering(idata, 1.2, 1.2, 0.4, -70, -90, 0, false);
			};
		}
		this.filters["vintage3"]=vint3Function(this);
		
		var purpleFunction=function(controller){
			return function(idata){
				var data=idata.data;
				return controller.generalRendering(idata, 1, 1, 1, 30, -60, 20, false);
			};
		}
		this.filters["purple"]=purpleFunction(this);
		
		var warmFunction=function(controller){
			return function(idata){
				var data=idata.data;
				return controller.generalRendering(idata, 1, 1, 1, -10, -40, -90, false);
			};
		}
		this.filters["warm"]=warmFunction(this);
		
		var neonFunction=function(controller){
			return function(idata){
				var data=idata.data;
				return controller.generalRendering(idata, 1, 1.5, 1, -10, -200, 00, false);
			};
		}
		this.filters["neon"]=neonFunction(this);
	};
	
	this.renderImageData=function(index,imgData){
		if(index && index.length>0 && this.filters[index]){
			imgData=this.filters[index](imgData);
			console.log("rendered filter: "+index);
		}
		return imgData;
	}
	
	this.render=function(index,ctx,vig, watermark){
		console.log("color-filter: "+index);
		if(index && index.length>0 && this.filters[index]){
			idata=this.renderImageData(index,ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height));
			ctx.putImageData(idata,0,0);			
		}

		return this.applyImageFilter(ctx, vig, watermark);
	};
	
	this.applyImageFilter=function(ctx, filtername, watermark){
		console.log("image-filter: "+filtername);
		if(filtername=="vig"){
			ctx=this.createVignetting(ctx);
		}
		else if(filtername=="displace"){
			ctx=this.createLineDisplace(ctx,false);
		}
		else if(filtername=="fishlies"){
			ctx=this.createFishlies(ctx);
		}
		if(watermark){
			console.log()
			ctx=this.addWatermark(ctx);
		}
		return ctx;
	};
	
	/**
	 * doesn't support all filters. only filter that works with the idata directly. no ctx operations!
	 */
	this.renderingForWorker=function(idata, colorFilter, imageFilter, width){
		console.log("async-width: "+width);
		console.log("async-color-filter: "+colorFilter);
		if(colorFilter && colorFilter.length>0 && this.filters[colorFilter]){
			idata=this.renderImageData(colorFilter,idata);			
		}		
		console.log("async-image-filter: "+imageFilter);
		if(imageFilter=="displace"){
			idata=this.createLineDisplaceRendering(idata,false,width);
		}
		else if(imageFilter=="fishlies"){
			idata=this.createFishliesRendering(idata,width);
		}
		return idata;
	};
	
	/**
	 * create worker for each image to apply filter
	 */
	this.renderFilterWorkers=function(imgList,filter, filter2, watermark, callBackFunction){
		var counter=0;
		var len=imgList.length;
		var cache=[];
		var rendered=[];
		
		var func=function(callBack,cacheA){
			return function(event){
				var edata=event.data;
				cacheA[edata.index]=edata;
				console.log("filterWorker returned data ("+(edata.index)+" : "+cacheA.length+")");
				if(cacheA.length==len){
					if(rendered.length<len){
						for(var i=0;i<cacheA.length;i++){
							if(cacheA[i]){
								imgList[cacheA[i].index].putImageData(cacheA[i].imageData,0,0);
								rendered[cacheA[i].index]=true;
							}				
						}
						
						if(rendered.length==len){			
							console.log("filters applied ("+rendered.length+"|"+len+")");
							callBack(imgList);
						}
					}				
				}
			};
		};
		
		for (var i = 0|0; i<len; i++) {			
			var worker = new Worker('./lib/filterWorker.js');
			worker.addEventListener('message', func(callBackFunction,cache,rendered), false);
			console.log("filter-worker #"+i+" was created.");
			var ctx=imgList[i];
			var postData={
				filter:filter,
				filter2:filter2,
				watermark:watermark,
				imageData:ctx.getImageData(0,0,ctx.canvas.width,ctx.canvas.height),
				width:ctx.canvas.width,
				index:i
			};			
			console.log(postData);
			worker.postMessage(postData);    
		}
	};
	
	this.renderAnimation=function(filter, images){
		if(filter=="revert"){
			var tmp=[];
			for(var i=images.length-1;i>=0;i--){
				tmp[tmp.length]=images[i];
			}
			images=tmp;
		}
		else if(filter=="playrewind"){
			var tmp=[];
			for(var i=images.length-1;i>=0;i--){
				tmp[tmp.length]=images[i];
			}
			for(var i=0;i<tmp.length;i++){
				images[images.length]=tmp[i];
			}
		}
		else if(filter=="playfastrewind"){
			var tmp=[];
			for(var i=images.length-1;i>=0;i--){
				tmp[tmp.length]=images[i];
			}
			for(var i=0;i<tmp.length;i=i+3){
				images[images.length]=tmp[i];
			}
		}
		else if(filter=="slowmotion"){
			var values=[];
			//only between 1/4 and 1/2 (1/2 to 3/4)
			for(var i=0;i<Math.round(images.length/2);i++){
				if(i>Math.round(images.length/4)){
					values[i]=Math.ceil((i+1-Math.round(images.length/4))/2);
				}
				else{
					values[i]=1;
				}				
			}
			var values2=[];
			for(var i=values.length-1;i>=0;i--){
				values2[values2.length]=values[i];
			}
			for(var i=0;i<values2.length;i++){
				values[values.length]=values2[i];
			}
			var tmp=[];
			for(var i=0;i<images.length;i++){
				for(var j=0;j<values[i];j++){
					tmp[tmp.length]=images[i];
				}
			}
			images=tmp;
		}
		console.log("animation-filter: " + filter + " -> " + images.length);
		return images;
	};
	
	this.init();
}