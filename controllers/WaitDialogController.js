function WaitDialogController(){
	this.message="";
	
	this.open=function(message){
		this.update(message);
		this.cJSElement.style.display="";
	};
	
	this.update=function(message){
		this.message=message;
		this.cjsPushBindings();
	};
	
	this.close=function(){
		this.update("");
		this.cJSElement.style.display="none";
	};
}