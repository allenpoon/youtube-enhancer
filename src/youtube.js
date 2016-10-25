{
	text:{
		Loop:'├⭮┤',
		Crop:'├⏵┤',
		Stop:'⏵',
		ButtonFrom:'A',
		ButtonTo:'B',
		PlaceHolderFrom:'From',
		PlaceHolderTo:'To',
		TooltipFromButton:'Set now as the start',
		TooltipToButton:'Set now as the end',
		TooltipLoopToCrop:'Looping; Click to Crop',
		TooltipCropToStop:'Cropped; Click to Normal',
		TooltipStopToLoop:'Normal; Click to Loop',
		TooltipFormat:'[ [ [ [ h: ] m: ] s. ] ms ]',
		TooltipFrom:'Start',
		TooltipTo:'End'
	},
	mode:{
		stop:1,
		loop:2,
		crop:3
	},
	curMode:1,

//	add \\ before \ because of string
	format:/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/,

//	player:null,
//	timer:null,
	duration:{
//		start:null,
//		end:null
	},
	setStop:function(){
		this.rmTimer();
	},
	setLoop:function(){
		this.rmTimer();
		if(	this.player.getPlayerState()!==1
		||	this.duration.end<=this.player.getCurrentTime()*1000
		||	this.player.getCurrentTime()*1000<this.duration.start
		){
			if(this.player.getPlayerState()===2)
				this.player.playVideo();
			this.player.seekTo(this.duration.start/1000,true);
		}
		this.setTimer(()=>this.setLoop());
	},
	setCrop:function(){
		this.rmTimer();
		if(this.duration.end<=this.player.getCurrentTime()*1000)
			this.player.seekTo(this.player.getDuration(),true);
		else{
			if(this.player.getCurrentTime()*1000<this.duration.start)
				this.player.seekTo(this.duration.start/1000,true);
			this.setTimer(()=>this.setCrop());
		}
	},
	setTimer:function(f){
		this.timer=setTimeout(f,this.duration.end-this.player.getCurrentTime()*1000);
	},
//	Return change of time range
	setRange:function(){
//		s == start
//		e == end
		let s,e;
		s=this.getSecond($('#replayerTimerFrom'));
		e=this.getSecond($('#replayerTimerTo'));
		
		if(e<=0||e>(this.player.getDuration()+1)*1000)
			e=Math.floor(this.player.getDuration()*1000);
		if(s<0)
			s=0;
		if(e<s){
			let t=s;
			s=e;
			e=t;
		}

		if(s==this.duration.start&&e==this.duration.end)
			return false;

		this.duration.start=s;
		this.duration.end=e;
		
		return true;
	},
	setA:function(){
		this.duration.start=Math.floor(this.player.getCurrentTime()*1000);
		if(!this.duration.end||this.duration.start>this.duration.end)
			this.duration.end=Math.floor(this.player.getDuration()*1000);
		this.showRepeatRange();
		this.toggle(this.curMode);
	},
	setB:function(){
		this.duration.end=Math.floor(this.player.getCurrentTime()*1000);
		if(!this.duration.start||this.duration.start>this.duration.end||this.duration.start<0)
			this.duration.start=0;
		this.showRepeatRange();
		this.toggle(this.curMode);
	},
	showRepeatRange:function(){
		$('#replayerTimerFrom').value=this.msToStr(this.duration.start);
		$('#replayerTimerTo').value=this.msToStr(this.duration.end);
	},
	rmTimer:function(){
		clearTimeout(this.timer);
		this.timer=null;
	},
	toggle:function(mode){
		if(!this.player||Object.keys(this.init.state).length!=0)
			setTimeout(()=>this.toggle(mode),100);
		else if(this.player.getAdState()>0){
			$('video').addEventListener('durationchange',()=>{
				let e=$('video');
				if(!isNaN(e.duration)){
					e.removeEventListener('durationchange',arguments.callee);
					this.toggle(mode);
				}
			});
			setTimeout(()=>this.toggle(mode),(this.player.getDuration()-this.player.getCurrentTime())*1000);
		}else{
			let e=$('#replayToggle');
			if(mode==this.mode.loop||!mode&&this.curMode==this.mode.stop){
				this.curMode=this.mode.loop;
				this.setRange()&&this.showRepeatRange();
				this.setLoop();
				e.innerHTML=this.text.Loop;
				e.title=e.dataset.tooltipText=this.text.TooltipLoopToCrop;
				$('video').loop=true;
			}else if(mode==this.mode.crop||!mode&&this.curMode==this.mode.loop){
				this.curMode=this.mode.crop;
				this.setRange()&&this.showRepeatRange();
				this.setCrop();
				e.innerHTML=this.text.Crop;
				e.title=e.dataset.tooltipText=this.text.TooltipCropToStop;
				$('video').loop=false;
			}else{
				this.curMode=this.mode.stop;
				this.rmTimer();
				e.innerHTML=this.text.Stop;
				e.title=e.dataset.tooltipText=this.text.TooltipStopToLoop;
				$('video').loop=false;
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

//	e == DOMInputElement
	getSecond:function(e){
		var t=e.value.match(this.format);
		var count=4;
		switch(''){
			case t[1]:count--;
			case t[2]:count--;
			case t[3]:count--;
			case t[4]:count--;
		}
		return!!count?(this.toSecond(t[1],count)+this.toSecond(t[2],count-1)+this.toSecond(t[3],count-2)+this.toSecond(t[4],count-3)):0;
	},
// var str = [<ms>, <s>, <m>, <h>]
	msToStr:function(t){
		let s=[t%1000,(Math.floor(t/1000))%60,(Math.floor(t/(60*1000)))%60,(Math.floor(t/(60*60*1000)))];
		return(s[3]>9?(s[3]+':'):s[3]>0?('0'+s[3]+':'):'')
					+(s[2]>9?(s[2]+':'):s[2]>0?('0'+s[2]+':'):s[3]>0?'00:':'')
					+(s[1]>9?(s[1]+'.'):s[1]>0?('0'+s[1]+'.'):'00.')
					+(s[0]>99?s[0]:s[0]>9?'0'+s[0]:'00'+s[0]);
	},
	IndexedDB:{
		isOpen:false,
		isReqOpen:false,
//		dbreq:null,
//		db:null,
		waitingFunctionList:[],
		openDB:function(){
			if(!window.indexedDB)
				console.log('IndexedDB is not support, no data will be saved.');
			else if(!this.isOpen&&!this.isReqOpen){
				this.dbreq=window.indexedDB.open('YouTubeReplayer',1);
				this.dbreq.onsuccess=(e)=>{
					this.db=e.target.result;
					this.isOpen=true;
					this.runWaitingFunction();
				};
				this.dbreq.onerror=(e)=>0;
				this.dbreq.onupgradeneeded=(evt)=>{
					var db=evt.target.result;
					if(!db.objectStoreNames.contains('replayRange'))
						db.createObjectStore('replayRange',{keyPath:'videoID'});
				};
			}else if(this.isOpen) 
				this.runWaitingFunction();
			this.isReqOpen=true;
		},
		runWaitingFunction:function(){
			let f;
			while(f=this.waitingFunctionList.shift())
				f.constructor==Function&&f();
		},
		getInfoByVideoID:function(vid,cb){
			this.waitingFunctionList.push(()=>{
				this.db.transaction(['replayRange']).objectStore('replayRange').get(vid).onsuccess=(evt)=>{
// for Database upgrade
					let r=evt.target.result;
					!!r&&!r.curMode&&(r.curMode=!!r.autoPlay?this.parent.mode.loop:this.parent.mode.stop)&&delete r.autoPlay;
					!!cb&&cb.constructor==Function&&cb(r);
				};
			});
			this.openDB();
		},
		setInfo:function(vid,data,cb){
			data.videoID=vid;
			this.waitingFunctionList.push(()=>{
				this.db.transaction(['replayRange'],'readwrite').objectStore('replayRange').put(data).onsuccess=(evt)=>
					!!cb&&cb.constructor==Function&&cb(evt.target.result);
			});
			this.openDB();
		},
		init:function(){
			!this.isReqOpen&&this.openDB();
		}
	},
	reset:{
		ReplayerTimer:function(){this.parent.rmTimer()},
		Duration:function(){this.parent.duration={start:null,end:null}},
		Player:function(){this.parent.player=$('#movie_player');$('video').loop=false;},
//		changing:false,
		main:function(){
			if(!this.changing){
				this.changing=true;
				for(var x in this)
					this[x].constructor==Function&&this[x]();
				this.changing=false;
			}
		}
	},
	unload:{
		SaveRecord:function(){
			let p=this.parent;
			if(p.duration.start!=null)
				p.IndexedDB.setInfo(
					p.init.curVideoID,
					{
						start:p.duration.start,
						end:p.duration.end,
						curMode:p.curMode
					},
					null
				)
		},
//		changing:false,
		main:function(){
			if(!this.changing){
				this.changing=true;
				for(var x in this)
					this[x].constructor==Function&&this[x]();
				this.changing=false;
			}
		}
	},
	init:{
		SetUnloadHandler:function(){
			if(!this.unloadHandler){
				window.addEventListener('beforeunload', ()=>this.parent.unload.main());
				this.unloadHandler=true;
			}
			this.state.unloadHandler=!!this.unloadHandler;
		},
		ReplayerLayout:function(){
			let e=$('#watch8-secondary-actions');
			if(!(this.state.replayer=!!this.state.replayer)&&!!e){
				let p=this.parent,t=p.text,f=t.TooltipFormat;
				e.innerHTML='<span>'
							+	'<input'
							+		' id=replayerTimerFrom'
							+		' size=6'
							+		' placeholder=\"'+t.PlaceHolderFrom+'\"'
							+		' title=\"'+t.TooltipFrom+' - '+f+'\"'
							+		' class=\"yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity\"'
							+		' style=\"text-align:right;font-size:larger;font-weight:bold\"'
							+	'>'
							+	'<button'
							+		' id=replayerA'
							+		' title=\"'+t.TooltipFromButton+'\"'
							+		' class=\"yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity\"'
							+		' style=\"text-align:center;font-size:larger;font-weight:bold\"'
							+	'>'
							+		t.ButtonFrom
							+	'</button>'
							+	'<button'
							+		' class=\"yt-uix-button yt-uix-button-text yt-uix-button-opacity\"'
							+		' style=\"font-size:larger;font-weight:bold\"'
							+	'>'
							+		'-'
							+	'</button>'
							+	'<button'
							+		' id=replayerB'
							+		' title=\"'+t.TooltipToButton+'\"'
							+		' class=\"yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity\"'
							+		' style=\"text-align:center;font-size:larger;font-weight:bold\"'
							+	'>'
							+		t.ButtonTo
							+	'</button>'
							+	'<input'
							+		' id=replayerTimerTo'
							+		' size=6'
							+		' placeholder=\"'+t.PlaceHolderTo+'\"'
							+		' title=\"'+t.TooltipTo+' - '+f+'\"'
							+		' class=\"yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity\"'
							+		' style=\"text-align:left;font-size:larger;font-weight:bold\"'
							+	'>'
							+	'<button'
							+		' id=replayToggle'
							+		' title=\"'+t.TooltipStopToLoop+'\"'
							+		' class=\"yt-uix-tooltip yt-uix-button yt-uix-button-text yt-uix-button-opacity\"'
							+		' style=\"text-align:center;font-size:large;font-weight:bold;width:65px\"'
							+	'>'
							+		t.Stop
							+	'</button>'
							+'</span>'
							+e.innerHTML;

				$('#watch8-secondary-actions #replayerTimerFrom').addEventListener('keyup',()=>
						window.event.keyCode==13
						&&p.toggle(p.curMode!=p.mode.stop?p.curMode:p.mode.crop)
					,false);

				$('#watch8-secondary-actions #replayerTimerTo').addEventListener('keyup',()=>
						window.event.keyCode==13
						&&p.toggle(p.curMode!=p.mode.stop?p.curMode:p.mode.crop)
				,false);

				$('#watch8-secondary-actions #replayerA').addEventListener('click',()=>p.setA(),false);

				$('#watch8-secondary-actions #replayerB').addEventListener('click',()=>p.setB(),false);

				$('#watch8-secondary-actions #replayToggle').addEventListener('click',()=>p.toggle(),false);

				this.state.replayer=true;
			}
		},
		ChangeYouTubeLayout:function(){
			if(this.state.replayer)
				if(!(this.state.likeDislike=!!this.state.likeDislike)){
					let e,eL;
					e=$('#watch-like-dislike-buttons');
					eL=!!e&&e.querySelectorAll('.yt-uix-button-content')||[];
					for(let i=0;i<eL.length;i++)
						this.state.likeDislike=!!eL[i]&&!!eL[i].parentNode.removeChild(eL[i]);
					eL=!!e&&e.querySelectorAll('button')||[];
					for(let i=0;i<eL.length;i++)
						if(!!eL[i]){
							eL[i].style.padding='0 5px';
							eL[i].querySelector('span').style.margin='0';
							eL[i].querySelector('.yt-uix-button-icon').style.margin='0';
						}
					this.state.likeDislike=true;
				}
		},
		ChangeQuanlity:function(){
			if(!this.state.playerQuality)
				this.parent.player.setPlaybackQuality(this.parent.player.getAvailableQualityLevels()[0]);
			this.state.playerQuality=(this.parent.player.getPlaybackQuality()==this.parent.player.getAvailableQualityLevels()[0]);
		},
		LoadInfoAndRun:function(){
			if(this.state.replayer&&!(this.state.IDBOpenReq=!!this.state.IDBOpenReq)){
				let p=this.parent;
				p.IndexedDB.init();
				this.state.IDBOpenReq=p.IndexedDB.isReqOpen;
				p.IndexedDB.getInfoByVideoID(yt.config_.VIDEO_ID,(info)=>{
					if(!!info){
						p.duration.start=info.start;
						p.duration.end=info.end;
						p.curMode=info.curMode;
						p.showRepeatRange();
						p.toggle(info.curMode);
					}
				});
			}
		},
//		curVideoID:'',
//		changing:false,
//		state:{},
		main:function(){
			if(!this.changing){
				this.changing=true;
				this.state={};
				if(!yt.config_.VIDEO_ID)
					this.curVideoID=null;
				else{
					let isNeedReset;
					if(isNeedReset=(this.curVideoID!=yt.config_.VIDEO_ID)){
						!!this.curVideoID&&this.parent.unload.main();
						this.parent.reset.main();
					}
					for(let x in this.state)
						if(isNeedReset=(isNeedReset||!this.state[x]))break;
					if(isNeedReset){
						this.curVideoID=yt.config_.VIDEO_ID;
//						try{
							for(let x in this)
								this[x].constructor==Function&&this[x]();
							let result=true;
							for(let x in this.state)
								result&=this.state[x];
							if(result)
								delete this.state;
							else 
								setTimeout(()=>this.main());
//						}catch(e){
//							console.log(e);
//						}
					}
				}
				this.changing=false;
			}
		}
	},
	start:function(){
// set parent
		this.reset.parent=
		this.unload.parent=
		this.IndexedDB.parent=
		this.init.parent=this;
		let f=()=>this.init.main();
		setTimeout(f);
		$('body').addEventListener('load',f,true)
	}
}
