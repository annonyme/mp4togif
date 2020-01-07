function FilesViewController(){
	this.ctxs=[];
	this.images=null;
	this.max=50;
				
	this.close=function(){
		this.cJSElement.style.display="none";
	};
				
	this.open=function(){
		this.cjsPushBindings();
		this.cJSElement.style.display="";
	};
				
	this.getImageList=function(fps,width,height,callback){		
		callback(this.ctxs);
	};
	
	this.addToCTXs=function(controller,img){
		return function(event){
			var canvas=document.createElement("canvas");
			canvas.width=img.width;
			canvas.height=img.height;
			var ctx=canvas.getContext("2d");
			ctx.drawImage(img,0,0,canvas.width,canvas.heigth);
			controller.ctxs[controller.ctxs.length]=ctx;
			
			controller.images.appendChild(img);
		};
	};
	
	this.addFunc=function(controller){
		return function(event){
			var url=event.target.result;
			var img=document.createElement("img");
			img.src=url;
			img.onload=controller.addToCTXs(controller,img);		
		};
	};
			
	this.openFiles=function(event){
		var files = event.target.files;
		if(files && files.length>0 && this.ctxs.length<this.max){
			for(var i=0;i<files.length && i<(this.max-this.ctxs.length);i++){
				var file=files[i];
				
				var reader = new FileReader();
				reader.onload = this.addFunc(this);
				reader.readAsDataURL(file);
				console.log("add file: "+file.name);
			}
		}
		else{
			console.log("can't add file");
		}
	};
	
	this.init=function(event){
		this.clear();
		this.cjsPushBindings();
		
	};
	
	this.clear=function(){
		this.ctxs=[];
		this.removeAllChildrenFromElement(this.images);
	};
	
	this.removeAllChildrenFromElement=function (element){			
		while(element.childNodes.length>0){
			element.removeChild(element.firstChild);
		}
	};
}