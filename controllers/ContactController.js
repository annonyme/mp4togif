function ContactController(){
	this.emails=[];	
	this.webpSupport=false;
	
	this.init=function(){
	
		this.addEmail("01","h_nichts_p_affe_hannespries_pkt__de");
	
		var canvas=document.createElement("canvas");
		var ctx=canvas.getContext("2d");
		canvas.height=20;
		canvas.width=150;
		
		ctx.fillStyle="#FFFFFF";
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
		
		ctx.fillStyle="#000000";
		ctx.fillText("test",5,10);
		this.webpSupport=ctx.canvas.toDataURL("image/webp").match(/image\/webp/)!=null;
		console.log("webp-support: "+this.webpSupport);
		
		for(var i=0;i<this.emails.length;i++){
			var email=this.emails[i];
			
			var func=function(controller,address){
				return function(event){
					controller.open(address);
				};
			};
			
			var el=document.getElementById(email.elementId);
			if(el){
				ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
				ctx.fillText(this.decode(email.email),5,10);
				/*
				if(this.webpSupport){
					el.src=ctx.canvas.toDataURL("image/webp");
				}
				else{
					el.src=ctx.canvas.toDataURL("image/png");
				}*/	

				el.src=ctx.canvas.toDataURL("image/png");				
				el.setAttribute("class","email");
				
				el.addEventListener("click",func(this,email.email),false);
			}			
		}
	};
	
	this.decode=function(txt){
		txt=txt.replace(/_affe_/,"@");
		txt=txt.replace(/_nichts_/,"");
		txt=txt.replace(/_pkt__/,".");
		return txt;
	};
	
	this.open=function(address){
		window.location.href="mailto:"+this.decode(address);
	};
	
	this.addEmail=function(id,adress){
		this.emails[this.emails.length]={elementId:id,email:adress};
	};
}