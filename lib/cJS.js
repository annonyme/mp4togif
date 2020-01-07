// ---------------------------------------------------------------------------
//					cJS 1.6 - by annonyme@annonyme.de
// ---------------------------------------------------------------------------

			function cJS(){
				this.controllers=[];
				this.restUrls=[];
				
				//--------- Helper Methods ---------------				
				
				this.removeAllChildrenFromElement=function(element){			
					while(element.childNodes.length>0){
						element.removeChild(element.firstChild);
					}
					return element;
				};
				
				this.setInnerTextOfElement=function(element,text){
					this.removeAllChildrenFromElement(element);
					element.appendChild(document.createTextNode(text));
					return element;
				};
				
				//--------- Modules with require.js ------
				
				this.isRequireJSSupported=function(){
					return typeof require == 'function';
				};
				
				this.getModule=function(moduleName,callBackFunc){
					if(typeof require == 'function'){
						try{
							require([""+moduleName],callBackFunc);
						}
						catch(e){
							console.log("ERROR: can not find require module '"+moduleName+"'");
						}
					}
					else{
						callBackFunc(null);
					}					
				};				
				
				//--------- REST API ---------------------
				
				this.addRESTUrl=function(name, urlWrapper){
					urlWrapper.name=name;
					this.restUrls[name]=urlWrapper;
					console.log("add REST-URL '"+name+"': "+this.restUrls[name].url);
				};
				
				this.jsonFunc=function(ajax,callBackfunction){
					return function(){
						if(ajax.readyState == 4){
							var obj=JSON.parse(ajax.responseText);
							callBackfunction(obj);
						}
					};
				};
				
				this.callRESTUrl=function(name,values,parameters,callbackFunction,post){
					var result=null;
					try{
						var ajax=this.getAjax();						
						if(ajax && this.restUrls[name]){
							var urlWrapper=this.restUrls[name];
							
							var method="GET";
							if(urlWrapper.method!=null && urlWrapper.method.length>0){
								method=urlWrapper.method;
							}
							else if(post){
								method="POST";
							}
							
							var url=urlWrapper.url;
							
							//replace {var}'s
							for (var key in values) {
								url.replace("{"+key+"}",encodeURI(values[key]));
							}
							
							//add get or post parameters
							var params="";
							parameters=parameters.concat(urlWrapper.preDefParameters);
							for (var key in parameters) {
								if(params.length>0){									
									params+="&";
								}
								params+=key+"="+encodeURI(parameters[key]);
							}
							
							if(callbackFunction==null && urlWrapper.callback!=null){
								callbackFunction=urlWrapper.callback;
							}
							
							result=this.performCall(url, params, method, callbackFunction, ajax);
						}
						else{
							console.log("ajax-request is null or REST-Url not existing under '"+name+"'");
						}
					}
					catch(e){
						console.log(e);
					}
					return result;
				};
				
				this.performCall=function(url,params,method,callbackFunction,ajax){
					if(!ajax){
						ajax=this.getAjax();
					}
					
					var result;
					if(callbackFunction){
						console.log("send async ajax-request ("+method+","+url+","+params+")");
					}
					else{
						console.log("send sync ajax-request ("+method+","+url+","+params+")");
					}
					
					if(method=="POST"){
						if(callbackFunction){
							ajax.onreadystatechange=this.jsonFunc(ajax,callbackFunction);							
							ajax.open(method, url, true);
							ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
							ajax.send(params);
							result=true;
						}
						else{
							ajax.open(method, url, false);
							ajax.setRequestHeader("Content-type","application/x-www-form-urlencoded");
							ajax.send(params);
							result=JSON.parse(ajax.responseText);
						}
					}
					else{
						if(callbackFunction){
							ajax.onreadystatechange=this.jsonFunc(ajax,callbackFunction);
							ajax.open(method, url+"?"+params, true);
							ajax.send();
							result=true;
						}
						else{
							console.log(url+"?"+params);
							ajax.open(method,url+"?"+params, false);							
							ajax.send();
							result=JSON.parse(ajax.responseText);
						}
					}					
					
					return result;
				};
				
				this.getAjax=function(){
					var http_request = null;
					try{
					  // Opera 8.0+, Firefox, Chrome, Safari
					  http_request = new XMLHttpRequest();
					}catch (e){
					    // Internet Explorer Browsers
					    try{
					        http_request = new ActiveXObject("Msxml2.XMLHTTP");
					    }catch (e) {
					        try{
					            http_request = new ActiveXObject("Microsoft.XMLHTTP");
					        }catch (e){
					            console.log("can't create XMLHttpRequest");
					            return null;
					        }
					    }
					}
					return http_request;
				};
				
				//--------- Controllers/Databinding ------
				
				this.addController=function(name,controller,containingElement,initMethod){
					var wrapper=new cJSControllerWrapper();
					wrapper.instance=controller;
					wrapper.name=name;
					
					controller.cJSName=name;
					controller.cJSElement=containingElement;
					
					if(containingElement!=null){
						wrapper=this.findEventBindings(wrapper,containingElement);
						wrapper=this.findValueBindings(wrapper,containingElement);
						wrapper=this.findElementBindings(wrapper,containingElement);
					}	

					var push=function(name){
						return function(){
							cjs.pushBindings(name);
						};
					};
						
					var pull=function(name){
						return function(){
							cjs.pullBindings(name);
						};
					};
						
					var get=function(name){
						return cjs.getController(name);
					};
						
					var call=function(name,values,parameters,callbackFunction,post){
						return cjs.callRESTUrl(name, values, parameters, callbackFunction, post);
					};
					
					var callSimple=function(url,params,method,callbackFunction){
						return cjs.performCall(url,params,method,callbackFunction,null);
					};
						
					var addUrl=function(name,url){
						return cjs.addRESTUrl(name, url);
					};
						
					var reqModule=function(moduleName,callBackFunc){
						cjs.getModule(moduleName, callBackFunc);
					};
						
					controller.cjsPushBindings=push(name);
					controller.cjsPullBindings=pull(name);
					controller.cjsGetController=get;
					controller.cjsCallREST=call;
					controller.cjsCallRESTSimple=callSimple;
					controller.cjsAddREST=addUrl;
					controller.cjsGetModule=reqModule;
					
					this.controllers[name]=wrapper;
					console.log("add controller '"+name+"'");
					
					if(initMethod!=null && initMethod.length>0 && wrapper.instance[initMethod]){
						console.log("call init: "+initMethod);
						wrapper.instance[initMethod]();
					}
				};
				
				this.getController=function(name){
					var result=null;
					if(this.controllers[name]){
						result=this.controllers[name].instance;
					}
					return result;
				};
				
				this.init=function(){
					//find all elements with controller-attribute
					var elements=document.querySelectorAll("[cjs-controller]");
					for(var i=0;i<elements.length;i++){
						var element=elements[i];
						var attr=element.getAttribute("cjs-controller");
						console.log("found controller -> "+attr);	
						var parts=attr.split(":");
						
						if(window[parts[1]]){
							var controller=new window[parts[1]]();
							
							var init=null;
							if(parts.length==3 && parts[2]){
								init=parts[2];
							}
							this.addController(parts[0],controller,element,init);
						}
						else{
							console.log("ERROR: can not find controller for '"+parts[0]+"'");
						}
					}
					
					if(this.isRequireJSSupported()){
						elements=document.querySelectorAll("[cjs-require-controller]");
						
						for(var i=0;i<elements.length;i++){
							var element=elements[i];
							var attr=element.getAttribute("cjs-require-controller");
							console.log("found controller -> "+attr);	
							var parts=attr.split(":");
							
							var init=null;
							if(parts.length==3 && parts[2]){
								init=parts[2];
							}
							
							var func=function(cjsObj,name,className,contrElement,initMethod){
								return function(module){
									try{
										if(module!=null){
											cjsObj.addController(name,module,contrElement,initMethod);
										}
										else{
											console.log("ERROR: require-module controller '"+name+"' can not be found.");
										}										
									}
									catch(e){
										console.log(e);
									}
								};
							};
							this.getModule(parts[1],func(this,parts[0],parts[1],element,init));
						}
					}
				};
				
				this.findEventBindings=function(controllerWrapper,containingElement){
					var elements=containingElement.querySelectorAll("[cjs-binding-event]");
					for(var i=0;i<elements.length;i++){
						var element=elements[i];
						var bindings=element.getAttribute("cjs-binding-event").split(";");
						for(var ib=0;ib<bindings.length;ib++){
							var binding=bindings[ib];
							var parts=binding.split(":");							
							var func=function (controller,method){
								return function(event){
									return controller[method](event);
								};
							};							
							element.addEventListener(parts[0],func(controllerWrapper.instance,parts[1]),false);
							console.log("["+controllerWrapper.name+"] add event binding '"+parts[0]+"' to element "+element.nodeName);
						}
					}
					return controllerWrapper;
				};
				
				this.findValueBindings=function(controllerWrapper,containingElement){
					var elements=containingElement.querySelectorAll("[cjs-binding-value]");
					for(var i=0;i<elements.length;i++){
						var element=elements[i];
						var valueName=element.getAttribute("cjs-binding-value");
						
						var type="text"; //enable types like 'text', 'checked', default is 'text' (pull only on 'text' and 'checked')
						if(valueName.match(/:/)){
							var parts=valueName.split(";");
							type=parts[1];
							valueName=parts[0];
						}
						else{
							//if not defined.. check if value as attribute is existing
							if(element["value"] || element.value || element.nodeName.toLowerCase()=="input" || element.nodeName.toLowerCase()=="select" || element.nodeName.toLowerCase()=="textarea"){
								type="value";
							}
							else{
								type="text";
							}
						}
						
						var wrapper=new cJSBindingWrapper();
						wrapper.name=valueName;
						wrapper.element=element;
						wrapper.type=type;
						controllerWrapper.valueBindings[controllerWrapper.valueBindings.length]=wrapper;
						console.log("["+controllerWrapper.name+"] add value-binding["+type+"] '"+valueName+"' to element "+element.nodeName);
					}
					return controllerWrapper;
				};
				
				this.findElementBindings=function(controllerWrapper,containingElement){
					var elements=containingElement.querySelectorAll("[cjs-binding-element]");
					for(var i=0;i<elements.length;i++){
						var element=elements[i];
						var valueName=element.getAttribute("cjs-binding-element");
						controllerWrapper.instance[valueName]=element;
						console.log("["+controllerWrapper.name+"] add element-binding '"+valueName+"' for element "+element.nodeName);
					}
					return controllerWrapper;
				};
				
				this.pushBindings=function(name){
					if(this.controllers[name]){
						var wrapper=this.controllers[name];
						var bindings=wrapper.valueBindings;						
						console.log("found controller '"+wrapper.name+"' ("+wrapper.valueBindings.length+")");						
						for(var i=0;i<bindings.length;i++){							
							var binding=bindings[i];
							console.log("push '"+binding.name+"' to "+binding.element.nodeName+" ("+binding.type+")");
							if(binding.type=="value"){
								binding.element.value=wrapper.instance[binding.name];								
							}
							else{
								this.setInnerTextOfElement(binding.element, wrapper.instance[binding.name]);
							}
						}						
					}
				};
				
				this.pullBindings=function(name){
					if(this.controllers[name]){
						var wrapper=this.controllers[name];
						var bindings=wrapper.valueBindings;						
						console.log("found controller '"+wrapper.name+"' ("+wrapper.valueBindings.length+")");						
						for(var i=0;i<bindings.length;i++){							
							var binding=bindings[i];
							if(binding.type=="value"){
								console.log("pull '"+binding.name+"' from "+binding.element.nodeName+" ("+binding.type+")");
								wrapper.instance[binding.name]=binding.element.value;
							}							
						}						
					}
				};
			}
			
			function cJSControllerWrapper(){
				this.name="";
				this.instance=null;
				this.valueBindings=[];
			}
			
			function cJSBindingWrapper(){
				this.name="";
				this.element=null;
				this.type="value";
			}	
			
			function cJSRestServiceMethod(){
				this.url="";
				this.name="";
				this.preDefParameters=[];
				this.method="";
				this.callback=null;
			}
			
			function cjsSetOnloadAction(cJSVar){
				return function(event){
					cJSVar.init();
				};
			}
			
			var cjs=new cJS();
			window.addEventListener("load",cjsSetOnloadAction(cjs));