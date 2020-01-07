function Switcher(){
	this.menuElement=null;
				
	this.changeView=function(event){
		if(this.menuElement){
			var children=this.menuElement.childNodes;
			for(var i=0;i<children.length;i++){
				var child=children[i];
				if(child.nodeName.toLowerCase()=="li"){
					child.setAttribute("class","");
					var controllerName=child.getAttribute("id").split("_")[1];
					console.log("close: "+controllerName);
					try{
						this.cjsGetController(controllerName).close();
					}
					catch(e){
					
					}					
				}
			}
		}
					
		event.target.parentNode.setAttribute("class","active");

		var controllerName=event.target.parentNode.id.split("_")[1];
		console.log("switch to: "+controllerName);
		this.cjsGetController(controllerName).open();					
		this.cjsGetController("creator").selectedController=controllerName;
	};
}