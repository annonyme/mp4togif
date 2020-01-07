function LiveViewController(){
	this.close=function(){
		this.cJSElement.style.display="none";
	};
				
	this.open=function(){
		this.cJSElement.style.display="";
	};
				
	this.getImageList=function(fps,width,height,callback){
		return [];		
	};
}