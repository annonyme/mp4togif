importScripts('./filters.js');
self.addEventListener('message', function(event) {
	var edata=event.data;
	if(edata.imageData){
		var filter=new Filters();
		console.log(edata);
		edata.imageData=filter.renderingForWorker(edata.imageData, edata.filter, edata.filter2, edata.width);
	}
	
	//------------
	
	self.postMessage({
						imageData:edata.imageData,
						index:edata.index
					});
	self.close();
	
},false);