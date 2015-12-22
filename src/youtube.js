Replayer = {
	player:null,
	setTimeoutTimer:function(){
		this.rmTimer();
		var e=document.getElementById('replayToggle');
		e.innerHTML='Stop';
		e.title='End Repeat';
		e.dataset.tooltipText='End Repeat';

		this.setRange();
		this.recordSaver();
		this.showRepeatRange();
		if(Replayer.player.getPlayerState()===1&&this.duration.end-Replayer.player.getCurrentTime()*1000>0&&Replayer.player.getCurrentTime()*1000-this.duration.start>=0){
			Replayer.timer.timeout=setTimeout(function(){Replayer.timer.timeout=setTimeout(function(){Replayer.setIntervalTimer()},Replayer.duration.end-Replayer.player.getCurrentTime()*1000)},1000);
		}else{
			this.setIntervalTimer();
		}
	},
	setRange:function(){
		this.duration.start=this.getSecond(document.getElementById('replayerTimerFrom'));
		this.duration.end=this.getSecond(document.getElementById('replayerTimerTo'));
		
		if(this.duration.end==0){
			this.duration.end=Math.floor(Replayer.player.getDuration()*1000);
		}
		if(this.duration.end<this.duration.start){
			var tmp=this.duration.start;
			this.duration.start=this.duration.end;
			this.duration.end=tmp;
		}
		if(this.duration.end<=0||this.duration.end>Replayer.player.getDuration()*1000){
			this.duration.end=Math.floor(Replayer.player.getDuration()*1000);
		}
		if(this.duration.end-this.duration.start<1){
			if(Replayer.player.getDuration()*1000<this.duration.start+1000){
				this.duration.end=this.duration.start+1000;
			}else{
				this.duration.start=this.duration.end-1000;
			}
		}
		if(this.duration.start<0){
			this.duration.start=0;
		}
	},
	showRepeatRange:function(){
		document.getElementById('replayerTimerFrom').value=this.msToStr(this.duration.start);
		document.getElementById('replayerTimerTo').value=this.msToStr(this.duration.end);
	},
	setIntervalTimer:function(){
		this.rmTimer();
		Replayer.player.seekTo(Replayer.duration.start/1000,true);
		if(Replayer.player.getPlayerState()===2){
			Replayer.player.playVideo();
		}
		Replayer.timer.timeout=setTimeout(function(){if(Replayer.player.getPlayerState()===1){Replayer.timer.timeout=setTimeout(function(){Replayer.setIntervalTimer()},Replayer.duration.end-Replayer.player.getCurrentTime()*1000)}else{Replayer.setIntervalTimer()}},1000);
	},
	rmTimer:function(){
		clearTimeout(Replayer.timer.timeout);
		Replayer.timer.timeout=null;
	},
	toggle:function(){
		var e=document.getElementById('replayToggle');
		if(e.innerHTML=='Loop'){
			this.setTimeoutTimer();
		}else{
			this.rmTimer();
			e.innerHTML='Loop';
			e.title='Start Repeat';
			e.dataset.tooltipText='Start Repeat';
		}
	},
	toSecond:function(value,level){
		if(level<=4&&level>0){
			value=this.toSecond(value*[60,60,1000,1][4-level],level-1);
		}
		return Number(value);
	},
	getSecond:function(e){
		var time=e.value.match(/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/); /* add \\ before \ because of string */
		var count=4;
		switch(''){
			case time[1]:count--;
			case time[2]:count--;
			case time[3]:count--;
			case time[4]:count--;
		}
		return !!count?(this.toSecond(time[1],count)+this.toSecond(time[2],count-1)+this.toSecond(time[3],count-2)+this.toSecond(time[4],count-3)):0;
	},
	msToStr:function(time){
		var str=[time%1000,(Math.floor(time/1000))%60,(Math.floor(time/(60*1000)))%60,(Math.floor(time/(60*60*1000)))];
		return(str[3]>9?(str[3]+':'):str[3]>0?('0'+str[3]+':'):'')
					+(str[2]>9?(str[2]+':'):str[2]>0?('0'+str[2]+':'):str[3]>0?'00:':'')
					+(str[1]>9?(str[1]+'.'):str[1]>0?('0'+str[1]+'.'):'00.')
					+(str[0]>99?str[0]:str[0]>9?'0'+str[0]:'00'+str[0]);
	},
	timer:{
		timeout:null
	},
	duration:{
		start:null,
		end:null
	},
	recordSaver:function(){
		this.IndexedDB.setInfo(yt.config_.VIDEO_ID,{start:this.duration.start,end:this.duration.end}, null);
	},
	IndexedDB:{
		isOpen:false,
		isReqOpen:false,
		db:null,
		openDB:function(){
			if(!this.isOpen){
				var dbreq=window.indexedDB.open('YouTubeReplayer',1);
				dbreq.onsuccess=function(e){
					console.log('indexed.open Success: ',e);
					Replayer.IndexedDB.db=e.target.result;
					Replayer.IndexedDB.isOpen=true;
				};
				dbreq.onerror=function(e){
					console.log('indexedDB.open Error: ',e);
				};
				dbreq.onupgradeneeded=function(evt){
					var db = evt.target.result;
					console.log('indexedDB.onupgradeneeded: ',evt);
					if(!db.objectStoreNames.contains('replayRange')){
						db.createObjectStore('replayRange',{keyPath: 'videoID'});
					}
				};
			}else{
				console.log('IDB is already started.');
			}
			this.isReqOpen=true;
		},
		getInfoByVideoID:function(videoID,callback){
			if(this.isOpen){
				var callBackTmp=callback;
				this.db.transaction(['replayRange']).objectStore('replayRange').get(videoID).onsuccess=function(evt){
					console.log('Read',evt);
					!!callBackTmp&&callBackTmp.constructor==Function&&callBackTmp(evt.target.result);
				};
			}else{
				console.log('IDB is not yet start.');
			}
		},
		setInfo:function(videoID,Info,callback){
			if(this.isOpen){
				var callBackTmp=callback;
				if(Info.constructor==Object){
					Info.videoID=videoID;
					this.db.transaction(['replayRange'], 'readwrite').objectStore('replayRange').put(Info).onsuccess=function(evt){
						console.log('Write',Info,evt.target.result);
						!!callBackTmp&&callBackTmp.constructor==Function&&callBackTmp(evt.target.result);
					};
				}
			}else{
				console.log('IDB is not yet start.');
			}
		},
		init:function(){
			!Replayer.IndexedDB.isReqOpen&&Replayer.IndexedDB.openDB();
		}
	},
	init:{
		ReplayerLayout:function(){
			var e=document.getElementById('watch-like-dislike-buttons');
			if(!Replayer.init.resetState.replayer&&!!e){
				var span,input;
				
				span=document.createElement('span');
				input=document.createElement('input');
				input.placeholder='From';
				input.size=8;
				input.title='Start<br>(H)(M)(S)(ms)<br>/^\\\\D*(\\\\d*)\\\\D*(\\\\d*)\\\\D*(\\\\d*)\\\\D*(\\\\d*)\\\\D*$/'; /* add \\ before \ because of string */
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text';
				input.style.textAlign='center';
				input.id='replayerTimerFrom';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.setTimeoutTimer();};},false);
				span.appendChild(input);
				e.appendChild(span);
				
				span=document.createElement('span');
				input=document.createElement('input');
				input.placeholder='To';
				input.size=8;
				input.title='End<br>(H)(M)(S)(ms)<br>/^\\\\D*(\\\\d*)\\\\D*(\\\\d*)\\\\D*(\\\\d*)\\\\D*(\\\\d*)\\\\D*$/'; /* add \\ before \ because of string */
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text';
				input.style.textAlign='center';
				input.id='replayerTimerTo';
				input.addEventListener('keyup',function(){if(window.event.keyCode==13){Replayer.setTimeoutTimer();};},false);
				span.appendChild(input);
				e.appendChild(span);
				
				span=document.createElement('span');
				input=document.createElement('button');
				input.id='replayToggle';
				input.title='Start Repeat';
				input.className='yt-uix-tooltip yt-uix-button yt-uix-button-text';
				input.addEventListener('click',function(){Replayer.toggle();},false);
				input.textContent='Loop';
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
		ResetReplayerTimer:function(){Replayer.rmTimer()},
		ShowRecordedRange:function(){
			if(!Replayer.init.resetState.IDBOpenReq){
				Replayer.IndexedDB.init();
				Replayer.init.resetState.IDBOpenReq=Replayer.IndexedDB.isReqOpen;
			}
			Replayer.init.resetState.showRecord=!!Replayer.init.resetState.showRecord;
			if(Replayer.init.resetState.IDBOpenReq&&Replayer.IndexedDB.isOpen&&!Replayer.init.resetState.showRecord){
				Replayer.IndexedDB.getInfoByVideoID(yt.config_.VIDEO_ID,function(info){
					if(!!info){
						Replayer.duration.start=info.start;
						Replayer.duration.end=info.end;
						Replayer.showRepeatRange();
					}
				});
				Replayer.init.resetState.showRecord=true;
			}
		},
		curVideoID:'',
		changing:false,
		resetState:{},
		reset:function(){
			if(!Replayer.init.changing){
				Replayer.init.changing=true;
				var isNeedReset=!!yt.config_.VIDEO_ID&&Replayer.init.curVideoID!=yt.config_.VIDEO_ID;
				for(x in Replayer.init.resetState){
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
