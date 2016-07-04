Replayer={
	text:{
		Loop:'Loop',
		Stop:'Stop',
		PlaceHolderFrom:'From',
		PlaceHolderTo:'To',
		TooltipStartLoop:'Start Repeat',
		TooltipEndLoop:'End Repeat',
		TooltipFormat:'[ [ [ h: ] m: ] s. ] ms',
		TooltipFrom:'Start',
		TooltipTo:'End'
	},

//	add \\ before \ because of string
	format:/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/,

	player:null,
	toggleAutoPlay:false,
	timer:null,
	duration:{
		start:null,
		end:null
	},
	setTimeoutTimer:function(){
		this.rmTimer();
		if(!(this.player.getPlayerState()===1&&this.duration.end>this.player.getCurrentTime()*1000&&this.player.getCurrentTime()*1000>=this.duration.start)){
			if(this.player.getPlayerState()===2)
				this.player.playVideo();
			this.player.seekTo(Replayer.duration.start/1000,true);
		}
		this.timer=setTimeout(function(){Replayer.setTimeoutTimer()},this.duration.end-this.player.getCurrentTime()*1000);
	},

//	Return change of time range
	setRange:function(){
		var start,end;
		start=this.getSecond($('#replayerTimerFrom'));
		end=this.getSecond($('#replayerTimerTo'));
		
		if(end<=0||end>(this.player.getDuration()+1)*1000)
			end=Math.floor(this.player.getDuration()*1000);
		if(start<0)	start=0;
		if(end<start){
			var tmp=start;
			start=end;
			end=tmp;
		}

//		if(end-start<1)
//			if(Replayer.player.getDuration()*1000<start+1000)
//				end=start+1000;
//			else 
//				start=end-1000;

		if(start==this.duration.start&&end==this.duration.end)return false;

		this.duration.start=start;
		this.duration.end=end;
		
		return true;
	},
	showRepeatRange:function(){
		$('#replayerTimerFrom').value=this.msToStr(this.duration.start);
		$('#replayerTimerTo').value=this.msToStr(this.duration.end);
	},
	rmTimer:function(){
		clearTimeout(this.timer);
		this.timer=null;
	},
	toggle:function(isForceLoop){
		if(!this.player || Object.keys(this.init.resetState).length!=0)
			setTimeout(function(){Replayer.toggle(isForceLoop)},100);
		else if(this.player.getAdState()>0){
			$('video').addEventListener('durationchange', function(){
				var e=$('video');
				if(!isNaN(e.duration)){
					e.removeEventListener('durationchange',arguments.callee);
					Replayer.toggle(isForceLoop);
				}
			});
			setTimeout(function(){Replayer.toggle(isForceLoop)},(this.player.getDuration()-this.player.getCurrentTime())*1000);
		}else{
			var e=$('#replayToggle');
			if(e.textContent==this.text.Loop||!!isForceLoop){
				this.setRange()&&this.showRepeatRange();
				this.setTimeoutTimer();
				this.setAutoReplay(0);
				e.innerHTML=this.text.Stop;
				e.title=e.dataset.tooltipText=this.text.TooltipEndLoop;
				$('video').loop=true;
			}else{
				this.rmTimer();
				this.setAutoReplay(1);
				e.innerHTML=this.text.Loop;
				e.title=e.dataset.tooltipText=this.text.TooltipStartLoop;
				$('video').loop=false;
			}
		}
	},
	setAutoReplay:function(toggle){
		var e=$('.toggle-autoplay');
		if(!!e)
			if(!!toggle&&this.toggleAutoPlay){
					e.click();
					this.toggleAutoPlay=false;
			}else if(!toggle&&!!$('.toggle-autoplay.yt-uix-button-toggled')){
					e.click();
					this.toggleAutoPlay=true;
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
				this.dbreq.onerror=function(e){};
				this.dbreq.onupgradeneeded=function(evt){
					var db=evt.target.result;
					if(!db.objectStoreNames.contains('replayRange')){
						db.createObjectStore('replayRange',{keyPath:'videoID'});
					}
				};
			}else if(this.isOpen) 
				this.runWaitingFunction();
			this.isReqOpen=true;
		},
		runWaitingFunction:function(){
			for(var i=0;i<Replayer.IndexedDB.waitingFunctionList.length;i++)
				!!Replayer.IndexedDB.waitingFunctionList[i]&&Replayer.IndexedDB.waitingFunctionList[i].constructor==Function&&Replayer.IndexedDB.waitingFunctionList[i]();
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
	reset:{
		ReplayerTimer:function(){Replayer.rmTimer()},
		Duration:function(){Replayer.duration={start:null,end:null}},
		Player:function(){Replayer.player=$('#movie_player');$('video').loop=false;},
		state:false,
		main:function(){
			if(!Replayer.reset.state){
				Replayer.reset.state=true;
				for(var x in Replayer.reset)
					Replayer.reset[x].constructor==Function&&Replayer.reset[x]();
				Replayer.reset.state=false;
			}
		}
	},
	unload:{
		SaveRecord:function(){if(Replayer.duration.start!=null)Replayer.IndexedDB.setInfo(Replayer.init.curVideoID,{start:Replayer.duration.start,end:Replayer.duration.end,autoPlay:!!Replayer.timer},null)},
		state:false,
		main:function(){
			if(!Replayer.unload.state){
				Replayer.unload.state=true;
				for(var x in Replayer.unload)
					Replayer.unload[x].constructor==Function&&Replayer.unload[x]();
				Replayer.unload.state=false;
			}
		}
	},
	init:{
		SetUnloadHandler:function(){
			if(!Replayer.init.unloadHandler){
				window.addEventListener('beforeunload', Replayer.unload.main);
				Replayer.init.unloadHandler=true;
			}
			Replayer.init.resetState.unloadHandler=!!Replayer.init.unloadHandler;
		},
		SetAutoPlay:function(){
			if(Replayer.init.resetState.replayer&&!(Replayer.init.resetState.setAutoPlay=!!Replayer.init.resetState.setAutoPlay)&&Replayer.init.resetState.IDBOpenReq){
				Replayer.toggleAutoPlay=Replayer.autoPlay;
				Replayer.setAutoReplay(1);
				Replayer.init.resetState.setAutoPlay=true;
			}
		},
		ReplayerLayout:function(){
			var e=$('#watch8-secondary-actions');
			if(!(Replayer.init.resetState.replayer=!!Replayer.init.resetState.replayer)&&!!e){
				var span,input,format=Replayer.text.TooltipFormat;
				
				span=document.createElement('span');
				input=document.createElement('input');
				input.placeholder=Replayer.text.PlaceHolderFrom;
				input.size=8;
				input.title=Replayer.text.TooltipFrom+' - '+format;
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text';
				input.style.textAlign='center';
				input.id='replayerTimerFrom';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.toggle(true);};},false);
				span.appendChild(input);
				e.appendChild(span);
				
				span=document.createElement('span');
				input=input.cloneNode(true);
				input.placeholder=Replayer.text.PlaceHolderTo;
				input.title=Replayer.text.TooltipTo+' - '+format;
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
			}
			if(!!$('#watch8-secondary-actions #replayerTimerFrom')&&!!$('#watch8-secondary-actions #replayerTimerTo')&&!!$('#watch8-secondary-actions #replayToggle'))
				Replayer.init.resetState.replayer=true;
		},
		ChangeYouTubeLayout:function(){
			var e,eL;
			if(Replayer.init.resetState.replayer){
				if(!(Replayer.init.resetState.likeDislike=!!Replayer.init.resetState.likeDislike)){
					e=$('#watch-like-dislike-buttons');
					!!e&&(eL=e.querySelectorAll('.yt-uix-button-content'))||(eL=[]);
					for(var i=0;i<eL.length;i++)
						Replayer.init.resetState.likeDislike=!!eL[i]&&!!eL[i].parentNode.removeChild(eL[i]);
					!!e&&(eL=e.querySelectorAll('button'))||(eL=[]);
					for(var i=0;i<eL.length;i++)
						if(!!eL[i]){
							eL[i].style.padding='0 5px';
							eL[i].querySelector('span').style.margin='0';
							eL[i].querySelector('.yt-uix-button-icon').style.margin='0';
						}
					Replayer.init.resetState.likeDislike=true;
				}
			}
		},
		ChangeQuanlity:function(){
			if(!Replayer.init.resetState.playerQuality)
				Replayer.player.setPlaybackQuality(Replayer.player.getAvailableQualityLevels()[0]);
			Replayer.init.resetState.playerQuality=(Replayer.player.getPlaybackQuality()==Replayer.player.getAvailableQualityLevels()[0]);
		},
		ShowRecordedRange:function(){
			if(Replayer.init.resetState.replayer&&!(Replayer.init.resetState.IDBOpenReq=!!Replayer.init.resetState.IDBOpenReq)){
				Replayer.IndexedDB.init();
				Replayer.init.resetState.IDBOpenReq=Replayer.IndexedDB.isReqOpen;
				Replayer.IndexedDB.getInfoByVideoID(yt.config_.VIDEO_ID,function(info){
					if(!!info){
						Replayer.duration.start=info.start;
						Replayer.duration.end=info.end;
						Replayer.autoPlay=info.autoPlay;
						Replayer.showRepeatRange();
						if(!!Replayer.autoPlay)
							Replayer.toggle(true);
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
				if(Replayer.init.curVideoID!=yt.config_.VIDEO_ID){
					!!Replayer.init.curVideoID&&Replayer.unload.main();
					Replayer.reset.main();
				}
				var isNeedReset=(!!yt.config_.VIDEO_ID&&Replayer.init.curVideoID!=yt.config_.VIDEO_ID);
				for(var x in Replayer.init.resetState)
					if(isNeedReset=(isNeedReset||!Replayer.init.resetState[x]))break;
				if(isNeedReset){
					Replayer.init.curVideoID=yt.config_.VIDEO_ID;
//					try{
						for(var x in Replayer.init)
							Replayer.init[x].constructor==Function&&Replayer.init[x]();
						var result=true;
						for(var x in Replayer.init.resetState)
							result&=Replayer.init.resetState[x];
						if(result)
							Replayer.init.resetState={};
						else 
							setTimeout(Replayer.init.main);
//					}catch(e){
//						console.log(e);
//					}
				}
				Replayer.init.changing=false;
			}
		}
	}
}
