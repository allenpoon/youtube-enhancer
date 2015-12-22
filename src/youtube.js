Replayer = {
	text:{
		Loop:'Loop',
		Stop:'Stop',
		PlaceHolderFrom:'From',
		PlaceHolderTo:'To',
		TooltipStartLoop:'Start Repeat',
		TooltipEndLoop:'End Repeat',
		TooltipFormat:'(H)(M)(S)(ms)',
		TooltipFrom:'Start',
		TooltipTo:'End'
	},
	format:/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/,/* add \\ before \ because of string */
	player:null,
	toggleAutoPlay:false,
	timer:{
		timeout:null
	},
	duration:{
		start:null,
		end:null
	},
	setTimeoutTimer:function(){
		this.rmTimer();
		if(!(this.player.getPlayerState()===1&&this.duration.end>this.player.getCurrentTime()*1000&&this.player.getCurrentTime()*1000>=this.duration.start)){
			if(this.player.getPlayerState()===2){
				this.player.playVideo();
			}
			this.player.seekTo(Replayer.duration.start/1000,true);
		}
		this.timer.timeout=setTimeout(function(){Replayer.setTimeoutTimer()},this.duration.end-this.player.getCurrentTime()*1000);
	},
	setRange:function(){/* Return change of time range */
		var start,end;
		start=this.getSecond(document.getElementById('replayerTimerFrom'));
		end=this.getSecond(document.getElementById('replayerTimerTo'));
		
		if(end<=0||end>(this.player.getDuration()+1)*1000){
			end=Math.floor(this.player.getDuration()*1000);
		}
		if(start<0)	start=0;
		if(end<start){
			var tmp=start;
			start=end;
			end=tmp;
		}
		if(end-start<1){
			if(Replayer.player.getDuration()*1000<start+1000){
				end=start+1000;
			}else{
				start=end-1000;
			}
		}
		
		if(start==this.duration.start&&end==this.duration.end)return false;

		this.duration.start=start;
		this.duration.end=end;
		
		return true;
	},
	showRepeatRange:function(){
		document.getElementById('replayerTimerFrom').value=this.msToStr(this.duration.start);
		document.getElementById('replayerTimerTo').value=this.msToStr(this.duration.end);
	},
	rmTimer:function(){
		clearTimeout(this.timer.timeout);
		this.timer.timeout=null;
	},
	toggle:function(isForceLoop){
		if(!this.player || Object.keys(this.init.resetState).length!=0){
			setTimeout((function(a){return function(){Replayer.toggle(a)};})(isForceLoop),100);
		}else if(this.player.getAdState()>0){
			this.player.querySelector('video').addEventListener('durationchange', (
				function(a){
					return function(){
						var e=Replayer.player.querySelector('video');
						if(!isNaN(e.duration)){
							e.removeEventListener('durationchange',arguments.callee);
							Replayer.toggle(a);
						}
					}
				})(isForceLoop)
			);
			setTimeout((function(a){return function(){Replayer.toggle(a)}})(isForceLoop),(this.player.getDuration()-this.player.getCurrentTime())*1000);
		}else{
			var e=document.getElementById('replayToggle');
			if(e.textContent==this.text.Loop||!!isForceLoop){
				this.setRange()&&this.showRepeatRange();
				this.setTimeoutTimer();
				this.setAutoReplay(0);
				e.innerHTML=this.text.Stop;
				e.title=e.dataset.tooltipText=this.text.TooltipEndLoop;
			}else{
				this.rmTimer();
				this.setAutoReplay(1);
				e.innerHTML=this.text.Loop;
				e.title=e.dataset.tooltipText=this.text.TooltipStartLoop;
			}
		}
	},
	setAutoReplay:function(toggle){
		var e=document.querySelector('.toggle-autoplay');
		if(!!e){
			if(!!toggle&&this.toggleAutoPlay){
					e.click();
					this.toggleAutoPlay=false;
			}else if(!toggle&&!!document.querySelector('.toggle-autoplay.yt-uix-button-toggled')){
					e.click();
					this.toggleAutoPlay=true;
			}
		}
	},
	toSecond:function(v,l){
		if(v.constructor==String&&l==1){
			if(v.length>=3)return Number(v);
			if(v.length==2)return Number(v)*10;
			if(v.length==1)return Number(v)*100;
		}
		if(l<=4&&l>0)	return this.toSecond(Number(v)*[60,60,1000,1][4-l],l-1);
		return Number(v);
	},
	getSecond:function(e){
		var t=e.value.match(this.format);
		var count=4;
		switch(''){
			case t[1]:count--;
			case t[2]:count--;
			case t[3]:count--;
			case t[4]:count--;
		}
		return !!count?(this.toSecond(t[1],count)+this.toSecond(t[2],count-1)+this.toSecond(t[3],count-2)+this.toSecond(t[4],count-3)):0;
	},
	msToStr:function(t){
		var str=[t%1000,(Math.floor(t/1000))%60,(Math.floor(t/(60*1000)))%60,(Math.floor(t/(60*60*1000)))];
		return(str[3]>9?(str[3]+':'):str[3]>0?('0'+str[3]+':'):'')
					+(str[2]>9?(str[2]+':'):str[2]>0?('0'+str[2]+':'):str[3]>0?'00:':'')
					+(str[1]>9?(str[1]+'.'):str[1]>0?('0'+str[1]+'.'):'00.')
					+(str[0]>99?str[0]:str[0]>9?'0'+str[0]:'00'+str[0]);
	},
	IndexedDB:{
		isOpen:false,
		isReqOpen:false,
		dbreq:null,
		db:null,
		waitingFunctionList:[],
		openDB:function(){
			if(!!window.indexedDB&&!this.isOpen&&!this.isReqOpen){
				this.dbreq=window.indexedDB.open('YouTubeReplayer',1);
				this.dbreq.onsuccess=function(e){
					Replayer.IndexedDB.db=e.target.result;
					Replayer.IndexedDB.isOpen=true;
					Replayer.IndexedDB.runWaitingFunction();
				};
				this.dbreq.onerror=function(e){
				};
				this.dbreq.onupgradeneeded=function(evt){
					var db=evt.target.result;
					if(!db.objectStoreNames.contains('replayRange')){
						db.createObjectStore('replayRange',{keyPath:'videoID'});
					}
				};
			}else if(this.isOpen){
				this.runWaitingFunction();
			}
			this.isReqOpen=true;
		},
		runWaitingFunction:function(){
			for(var i=0;i<Replayer.IndexedDB.waitingFunctionList.length;i++){
				!!Replayer.IndexedDB.waitingFunctionList[i]&&Replayer.IndexedDB.waitingFunctionList[i].constructor==Function&&Replayer.IndexedDB.waitingFunctionList[i]();
			}
			Replayer.IndexedDB.waitingFunctionList=[];
		},
		getInfoByVideoID:function(videoID,callback){
			this.waitingFunctionList[this.waitingFunctionList.length]=(
				function(vid,cb){
					return function(){
						Replayer.IndexedDB.db.transaction(['replayRange']).objectStore('replayRange').get(vid).onsuccess=function(evt){
							!!cb&&cb.constructor==Function&&cb(evt.target.result);
						};
					};
				}
			)(videoID,callback);
			this.openDB();
		},
		setInfo:function(videoID,Info,callback){
			this.waitingFunctionList[this.waitingFunctionList.length]=(
				function(vid,data,cb){
					return function(){
						data.videoID=videoID;
						Replayer.IndexedDB.db.transaction(['replayRange'],'readwrite').objectStore('replayRange').put(data).onsuccess=function(evt){
							!!cb&&cb.constructor==Function&&cb(evt.target.result);
						};
					};
				}
			)(videoID,Info,callback);
			this.openDB();
		},
		init:function(){
			!Replayer.IndexedDB.isReqOpen&&Replayer.IndexedDB.openDB();
		}
	},
	unload:{
		ResetReplayerTimer:function(){Replayer.rmTimer()},
		SaveAutoPlay:function(){window.localStorage['Replayer-isAutoPlay']=Replayer.toggleAutoPlay},
		SaveRecord:function(){if(!!Replayer.duration.start)Replayer.IndexedDB.setInfo(yt.config_.VIDEO_ID,{start:Replayer.duration.start,end:Replayer.duration.end,autoPlay:document.getElementById('replayToggle').textContent==Replayer.text.Stop},null)},
		state:false,
		main:function(){
			if(!Replayer.unload.state){
				Replayer.unload.state=true;
				for(var x in Replayer.unload){
					Replayer.unload[x].constructor==Function&&Replayer.unload[x]();
				}
				Replayer.unload.state=false;
			}
		}
	},
	init:{
		SetUnloadHandler:function(){
			if(!Replayer.init.resetState.unloadHandler){
				window.onbeforeunload=function(){Replayer.unload.main();};
				Replayer.init.resetState.unloadHandler=true;
			}
		},
		SetAutoPlay:function(){
			if(!Replayer.init.resetState.setAutoPlay){
				Replayer.toggleAutoPlay=(window.localStorage['Replayer-isAutoPlay']=='true');
				Replayer.setAutoReplay(1);
				Replayer.init.resetState.setAutoPlay=true;
			}
		},
		ReplayerLayout:function(){
			var e=document.getElementById('watch-like-dislike-buttons');
			if(!Replayer.init.resetState.replayer&&!!e){
				var span,input,format='<br>'+Replayer.text.TooltipFormat+'<br>'+Replayer.format;
				
				span=document.createElement('span');
				input=document.createElement('input');
				input.placeholder=Replayer.text.PlaceHolderFrom;
				input.size=8;
				input.title=Replayer.text.TooltipFrom+format;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text';
				input.style.textAlign='center';
				input.id='replayerTimerFrom';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.toggle(true);};},false);
				span.appendChild(input);
				e.appendChild(span);
				
				span=span.cloneNode();
				input=input.cloneNode(true);
				input.placeholder=Replayer.text.PlaceHolderTo;
				input.title=Replayer.text.TooltipTo+format;
				input.id='replayerTimerTo';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.toggle(true);};},false);
				span.appendChild(input);
				e.appendChild(span);
				
				span=document.createElement('span');
				input=document.createElement('button');
				input.id='replayToggle';
				input.title=Replayer.text.TooltipStartLoop;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text';
				input.addEventListener('click',function(){Replayer.toggle();},false);
				input.textContent=Replayer.text.Loop;
				span.appendChild(input);
				e.appendChild(span);
				
				Replayer.init.resetState.replayer=true;
			}
		},
		ChangeYouTubeLayout:function(){
			var e,e1;
			if(!Replayer.init.resetState.dislike){
				e=document.getElementById('watch-like-dislike-buttons');
				!!e&&(e=e.querySelector('.yt-uix-button-content'));
				Replayer.init.resetState.dislike=!!e&&!!e.parentNode.removeChild(e);
			}
			
			if(!Replayer.init.resetState.report||!Replayer.init.resetState.stats){
				e=document.getElementById('watch7-secondary-actions');
				if(!Replayer.init.resetState.report){
					!!e&&(e1=e.querySelector('.yt-uix-button-icon-action-panel-report').parentNode.parentNode.parentNode);
					Replayer.init.resetState.report=!!e1&&!!e1.parentNode.removeChild(e1);
				}
				if(!Replayer.init.resetState.stats){
					!!e&&(e1=e.querySelector('.yt-uix-button-icon-action-panel-stats').parentNode.parentNode.parentNode);
					Replayer.init.resetState.stats=!!e1&&!!e1.parentNode.removeChild(e1);
				}
			}

			if(!Replayer.init.resetState.like){
				e=document.getElementById('watch-like');
				Replayer.init.resetState.like=!!e&&!!(e.style.padding='0 5px')&&!!(e.querySelector('span').style.margin='0')&&!!(e.querySelector('.yt-uix-button-icon').style.margin='0');
			}
		},
		ChangeQuanlity:function(){
			if(!Replayer.init.resetState.playerQuality){
				Replayer.player.setPlaybackQuality(Replayer.player.getAvailableQualityLevels()[0]);
				Replayer.init.resetState.playerQuality=(Replayer.player.getPlaybackQuality()==Replayer.player.getAvailableQualityLevels()[0]);
			}
		},
		ShowRecordedRange:function(){
			if(Replayer.init.resetState.setAutoPlay&&!Replayer.init.resetState.IDBOpenReq){
				Replayer.IndexedDB.init();
				Replayer.init.resetState.IDBOpenReq=Replayer.IndexedDB.isReqOpen;
				Replayer.IndexedDB.getInfoByVideoID(yt.config_.VIDEO_ID,function(info){
					if(!!info){
						Replayer.duration.start=info.start;
						Replayer.duration.end=info.end;
						Replayer.showRepeatRange();
						if(!!info.autoPlay){
							Replayer.toggle(true);
						}
					}
				});
			}
		},
		curVideoID:'',
		changing:false,
		resetState:{},
		main:function(){
			if(!Replayer.init.changing){
				Replayer.init.changing=true;
				var isNeedReset=!!yt.config_.VIDEO_ID&&Replayer.init.curVideoID!=yt.config_.VIDEO_ID;
				for(var x in Replayer.init.resetState){
					if(isNeedReset=(isNeedReset||!Replayer.init.resetState[x]))break;
				}
				if(isNeedReset){
					Replayer.player=document.getElementById('movie_player');
					try{
						for(var x in Replayer.init){
							Replayer.init[x].constructor==Function&&Replayer.init[x]();
						}
						var result=true;
						for(var x in Replayer.init.resetState){
							result&=Replayer.init.resetState[x];
						}
						result&&(Replayer.init.curVideoID=yt.config_.VIDEO_ID)&&(Replayer.init.resetState={});
					}catch(e){
						console.log(e);
					}
				}
				Replayer.init.changing=false;
			}
		}
	}
}