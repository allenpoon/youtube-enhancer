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
	ui:{
//		fromRange: <DOMInputElement>,
//		toRange: <DOMInputElement>,
//		aButton: <DOMButtonElement>,
//		bButton: <DOMButtonElement>,
//		actionButton: <DOMButtonElement>,
	},
//	player: <DOMDivElement with player control prototype>,
//	video: <DOMVideoElement>
	mode:{
		stop:1,
		loop:2,
		crop:3
	},
	curMode:1,

//	add \\ before \ because of string
	format:/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/,

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
		s=this.getSecond(this.ui.fromRange);
		e=this.getSecond(this.ui.toRange);
		
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
		this.ui.fromRange.value=this.msToStr(this.duration.start);
		this.ui.toRange.value=this.msToStr(this.duration.end);
	},
	rmTimer:function(){
		clearTimeout(this.timer);
		this.timer=null;
	},
	toggle:function(mode){
		let v=this.video;
		if(this.player.getAdState()>0){
			let f;
			v.addEventListener('durationchange',f=()=>{
				if(!isNaN(v.duration)){
					v.removeEventListener('durationchange',f);
					this.toggle(mode);
				}
			});
			// setTimeout(()=>this.toggle(mode),(this.player.getDuration()-this.player.getCurrentTime())*1000);
		}else{
			let e=this.ui.actionButton;
			if(mode==this.mode.loop||!mode&&this.curMode==this.mode.stop){
				this.curMode=this.mode.loop;
				this.setRange()&&this.showRepeatRange();
				this.setLoop();
				e.innerHTML=this.text.Loop;
				e.title=e.dataset.tooltipText=this.text.TooltipLoopToCrop;
				v.loop=true;
			}else if(mode==this.mode.crop||!mode&&this.curMode==this.mode.loop){
				this.curMode=this.mode.crop;
				this.setRange()&&this.showRepeatRange();
				this.setCrop();
				e.innerHTML=this.text.Crop;
				e.title=e.dataset.tooltipText=this.text.TooltipCropToStop;
				v.loop=false;
			}else{
				this.curMode=this.mode.stop;
				this.rmTimer();
				e.innerHTML=this.text.Stop;
				e.title=e.dataset.tooltipText=this.text.TooltipStopToLoop;
				v.loop=false;
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

//	e:DOMInputElement
//  c:int == count
//  t:array(string) == time list
	getSecond:function(e){
		let t=e.value.match(this.format),c=4;
		switch(''){
			case t[1]:c--;
			case t[2]:c--;
			case t[3]:c--;
			case t[4]:c--;
		}
		return!!c?(this.toSecond(t[1],c)+this.toSecond(t[2],c-1)+this.toSecond(t[3],c-2)+this.toSecond(t[4],c-3)):0;
	},
	msToStr:function(t){
		// s = [<ms>, <s>, <m>, <h>]
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
					let db=evt.target.result;
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
		RemoveUIRef:function(){
			let p=this.parent;
			delete p.ui;
			p.ui={};
		},
//		changing:false,
		main:function(){
			if(!this.changing){
				this.changing=true;
				for(let x in this)
					this[x].constructor==Function&&this[x]();
				this.changing=false;
			}
		}
	},
	init:{
		RemoveTimer:function(){
			if(!this.state.removeTimer){
				this.parent.rmTimer();
				this.state.removeTimer=true;
			}
		},
		UpdateDuration:function(){
			if(!this.state.resetDuration){
				this.parent.duration={start:null,end:null};
				this.state.resetDuration=true;
			}
		},
		StopLoop:function(){
			if(!(this.state.setLoop=!!this.state.setLoop)){
				this.parent.video.loop=false;
				this.state.setLoop=true;
			}
		},
		SetLayout:function(){
			let e=$('#watch8-secondary-actions');
			if(!(this.state.replayer=!!this.state.replayer)&&!!e){
				let p=this.parent,t=p.text,f=t.TooltipFormat,nE=document.createElement('div'),nEc=nE.children;
				nE.classList.add('yt-uix-menu','yt-uix-button-opacity','yt-uix-button-text');
				nE.style.border='2px solid grey';
				nE.style.borderRadius='10px';
							// From (Time Range): index == 0
				nE.innerHTML='<input'
							+	' size=6'
							+	' placeholder=\"'+t.PlaceHolderFrom+'\"'
							+	' title=\"'+t.TooltipFrom+' - '+f+'\"'
							+	' class=\"yt-uix-tooltip yt-uix-button\"'
							+	' style=\"text-align:right;font-size:larger;font-weight:bold\"'
							+'>'
							// From (Button): index == 1
							+'<button'
							+	' title=\"'+t.TooltipFromButton+'\"'
							+	' class=\"yt-uix-tooltip yt-uix-button\"'
							+	' style=\"text-align:center;font-size:larger;font-weight:bold\"'
							+'>'
							+	t.ButtonFrom
							+'</button>'
							+'<button'
							+	' class=\"yt-uix-button\"'
							+	' style=\"font-size:larger;font-weight:bold\"'
							+'>'
							+	'-'
							+'</button>'
							// To (Button): index == 3
							+'<button'
							+	' title=\"'+t.TooltipToButton+'\"'
							+	' class=\"yt-uix-tooltip yt-uix-button\"'
							+	' style=\"text-align:center;font-size:larger;font-weight:bold\"'
							+'>'
							+	t.ButtonTo
							+'</button>'
							// To (Time Range): index == 4
							+'<input'
							+	' size=6'
							+	' placeholder=\"'+t.PlaceHolderTo+'\"'
							+	' title=\"'+t.TooltipTo+' - '+f+'\"'
							+	' class=\"yt-uix-tooltip yt-uix-button\"'
							+	' style=\"text-align:left;font-size:larger;font-weight:bold\"'
							+'>'
							// Replayer Action (Button): index == 5
							+'<button'
							+	' title=\"'+t.TooltipStopToLoop+'\"'
							+	' class=\"yt-uix-tooltip yt-uix-button\"'
							+	' style=\"text-align:center;font-size:large;font-weight:bold;width:65px\"'
							+'>'
							+	t.Stop
							+'</button>';
				e.insertBefore(nE,e.lastChild);

				let ui=this.parent.ui;
				(ui.fromRange=nEc[0]).addEventListener('keyup',(evt)=>
						evt.keyCode==13
						&&p.toggle(p.curMode!=p.mode.stop?p.curMode:p.mode.crop)
					,false);

				(ui.aButton=nEc[1]).addEventListener('click',()=>p.setA(),false);

				(ui.bButton=nEc[3]).addEventListener('click',()=>p.setB(),false);

				(ui.toRange=nEc[4]).addEventListener('keyup',(evt)=>
						evt.keyCode==13
						&&p.toggle(p.curMode!=p.mode.stop?p.curMode:p.mode.crop)
				,false);

				(ui.actionButton=nEc[5]).addEventListener('click',()=>p.toggle(),false);

				this.state.replayer=true;
			}
		},
		ChangeYouTubeLayout:function(){
			// remove like number
			let e=$('.like-button-renderer');
			if(!!e&&!(this.state.likeDislike=!!this.state.likeDislike)){
				let eC=e.children;
				eC[0].children[0].removeChild(eC[0].children[0].children[0]);
				eC[2].children[0].removeChild(eC[2].children[0].children[0]);
				this.state.likeDislike=true;
			}
		},
		ChangeQuanlity:function(){
			if(!(this.state.playerQuality=(this.parent.player&&this.parent.player.getPlaybackQuality()==this.parent.player.getAvailableQualityLevels()[0])))
				this.parent.player.setPlaybackQuality(this.parent.player.getAvailableQualityLevels()[0]);
		},
		LoadInfoAndRun:function(){
			if(!(this.state.IDBOpenReq=!!this.state.IDBOpenReq)&&this.state.replayer){
				let p=this.parent;
				p.IndexedDB.init();
				this.state.IDBOpenReq=p.IndexedDB.isReqOpen;
				p.IndexedDB.getInfoByVideoID(this.curVideoID,(info)=>{
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
				let newVideoID=this.parent.player.getVideoStats().docid;
				if(newVideoID){
					if(this.state){
						let result=true;

						this.state=this.state||{};
						this.curVideoID=newVideoID;

						this.changing=true;
						for(let x in this)
							this[x].constructor==Function&&this[x]();
						this.changing=false;

						for(let x in this.state)
							if(!this.state[x]){
								result=false;
								break;
							}

						if(result)
							delete this.state;
						else 
							setTimeout(()=>this.main());
					}else if(this.curVideoID!=newVideoID){
						// this.state should be null
						this.state={};
						if(this.curVideoID)
							this.parent.unload.main();
						this.main();
					}
				}
			}
		}
	},
	start:function(){
		// set parent
		this.unload.parent=
		this.IndexedDB.parent=
		this.init.parent=this;

		let f=()=>{
			this.player=$('#movie_player');
			this.video=$('video');
			if(this.player&&this.video){
				this.video.addEventListener('durationchange',()=>this.init.main());
				this.init.main();
			}else{
				setTimeout(f);
			}
		};
		f();
		window.addEventListener('beforeunload',()=>this.unload.main());
	}
}
