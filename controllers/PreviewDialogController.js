function PreviewDialogController(){
	this.dataurl="";
	this.type="";
	
	this.facebookButton=null;
	
	this.gif=null;
	this.video=null;
	
	this.open=function(dataurl,type){
		this.dataurl=dataurl;
		this.type=type;
		
		if(this.type=="video"){
			this.video.src=this.dataurl;
			this.video.style.display="";
			this.gif.style.display="none";
			this.facebookButton.style.display="none";
		}	
		else{
			this.gif.src=this.dataurl;
			this.video.style.display="none";
			this.gif.style.display="";
			this.facebookButton.style.display="none";
		}	
		this.cJSElement.style.display="";
	};
	
	this.download=function(){
		//window.open(this.dataurl);
		this.downloadAsFile();
	};
	
	this.dataURItoBlobSave=function(dataURI) {
		try{
			if(dataURI.match(/^blob/)){
				throw new Exception("it is a blob");
			}
			
			// convert base64 to raw binary data held in a string
			var byteString = atob(dataURI.split(',')[1]);
			 
			// separate out the mime component
			var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
			 
			// write the bytes of the string to an ArrayBuffer
			var arrayBuffer = new ArrayBuffer(byteString.length);
			var _ia = new Uint8Array(arrayBuffer);
			for (var i = 0; i < byteString.length; i++) {
				_ia[i] = byteString.charCodeAt(i);
			}
			 
			var dataView = new DataView(arrayBuffer);
			var blob = new Blob([dataView], { type: mimeString });
			
			var ts=new Date().getTime();
			
			var ext="gif";
			if(this.type=="video"){
				ext="webm";
			}
			saveAs(blob, "your_"+ext+"_from_mp4togif_com_"+ts+"."+ext);
		}
		catch(e){
			var func=function(type,con){
				return function(e) {
					if (this.status == 200) {						
						var uInt8Array = new Uint8Array(this.response);
					    var i = uInt8Array.length;
					    var binaryString = new Array(i);
					    while (i--)
					    {
					      binaryString[i] = String.fromCharCode(uInt8Array[i]);
					    }
					    var blob = binaryString.join('');

					    var mine="image/gif";
					    if(type=="video"){
					    	mime="video/webm";
					    }
					    
					    var base64 = "data:"+mime+";base64,"+window.btoa(blob);
					    con.dataURItoBlobSave(base64);					    
					}
				};
			};	

			var xhr = new XMLHttpRequest();
			xhr.open('GET', dataURI, true);
			xhr.responseType = 'arraybuffer';
			xhr.onload = func(this.type,this);
			xhr.send();	
		}
		
		//return blob;
	}
	
	this.downloadAsFile=function(){
		this.dataURItoBlobSave(this.dataurl);
	}
	
	this.facebook=function(){
		
	};
	
	this.close=function(){
		this.video.src=""
		this.gif.src="";
		this.dataurl="";
		this.cJSElement.style.display="none";
	};
}