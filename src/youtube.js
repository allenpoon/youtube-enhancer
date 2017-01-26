// for debugging use
//window.Replayer={
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
//	videoID:'',
	mode:{
		stop:1,
		loop:2,
		crop:3
	},
	curMode:1,

	format:/^\D*(\d*)\D*(\d*)\D*(\d*)\D*(\d*)\D*$/,

//	timer:null,
	duration:{
//		deprecated, this unit is ms
//		start:null,
//		deprecated, this unit is ms
//		end:null

//		this unit is s
//		from:null,
//		this unit is s
//		to:null
	},
	setStop:function(){
		this.curMode=this.mode.stop;
		this.video.loop=false;
		this.rmTimer();
	},
	setLoop:function(){
		this.curMode=this.mode.loop;

		let p=this.player;
		if(	this.duration.to<=p.getCurrentTime()
		||	p.getCurrentTime()<=this.duration.from
		){
			p.seekTo(this.duration.from,true);
		}

		this.video.loop=true;
		if(	this.duration.to+0.001<p.getDuration()){
			if(	p.getPlayerState()===1
			||	p.getPlayerState()===3
			){
				this.setTimer(()=>this.setLoop());
			}
		}
	},
	setCrop:function(){
		this.curMode=this.mode.crop;

		let p=this.player;
		if(	this.duration.to<=p.getCurrentTime()
		&&	p.getPlayerState()===1
		){
			p.seekTo(p.getDuration(),true);
		}else if(p.getCurrentTime()<this.duration.from){
			p.seekTo(this.duration.from,true);
		}

		this.video.loop=false;
		if(	this.duration.to+0.001<p.getDuration()){
			if(	p.getPlayerState()===1
			||	p.getPlayerState()===3
			){
				this.setTimer(()=>this.setCrop());
			}
		}
	},
	setTimer:function(f){
		this.rmTimer();
		this.timer=setTimeout(f,(this.duration.to-this.player.getCurrentTime())*1000/this.player.getPlaybackRate());
	},
//	Return change of time range
	setRange:function(){
//		s == from
//		e == to
		if(!this.ui.ready)	return false;

		let s=this.getSecond(this.ui.fromRange)
		,	e=this.getSecond(this.ui.toRange);
		
		if(e<=0||e>this.player.getDuration()+1){
			e=this.player.getDuration();
		}
		if(s<0){
			s=0;
		}
		if(e<s){
			[s,e]=[e,s];
		}
		this.duration.from=s;
		this.duration.to=e;
		return true;
	},
	setA:function(){
		this.duration.from=this.player.getCurrentTime();
		if(!this.duration.to
		||	this.duration.from>this.duration.to
		){
			this.duration.to=this.player.getDuration();
		}
		this.updateInterface();
		this.toggle(this.curMode);
	},
	setB:function(){
		this.duration.to=this.player.getCurrentTime();
		if(!this.duration.from
		||	this.duration.from>this.duration.to
		||	this.duration.from<0
		){
			this.duration.from=0;
		}
		this.updateInterface();
		this.toggle(this.curMode);
	},
	updateInterface:function(){
		if(this.ui.ready){
			if(this.duration.from||this.duration.to){
				let e=this.ui
				,	eB=e.actionButton;
				e.fromRange.value=this.msToStr(this.duration.from*1000);
				e.toRange.value=this.msToStr(this.duration.to*1000);
				switch(this.curMode){
					case this.mode.loop:
						eB.innerHTML=this.text.Loop;
						eB.title=eB.dataset.tooltipText=this.text.TooltipLoopToCrop;
						break;
					case this.mode.crop:
						eB.innerHTML=this.text.Crop;
						eB.title=eB.dataset.tooltipText=this.text.TooltipCropToStop;
						break;
					case this.mode.stop:
						eB.innerHTML=this.text.Stop;
						eB.title=eB.dataset.tooltipText=this.text.TooltipStopToLoop;
						break;
				}
			}
		}
	},
	rmTimer:function(){
		clearTimeout(this.timer);
		this.timer=null;
	},
	toggle:function(mode){
//		let v=this.video;
//		if(this.player.getAdState()>0){
//			let f;
//			v.addEventListener('durationchange',f=()=>{
//				if(!isNaN(v.duration)){
//					v.removeEventListener('durationchange',f);
//					this.toggle(mode);
//				}
//			});
//			// setTimeout(()=>this.toggle(mode),(this.player.getDuration()-this.player.getCurrentTime())*1000);
//		}else{
			if(mode==this.mode.loop||(!mode&&this.curMode==this.mode.stop)){
				this.setLoop();
			}else if(mode==this.mode.crop||(!mode&&this.curMode==this.mode.loop)){
				this.setCrop();
			}else{
				this.setStop();
			}
			this.updateInterface();
//		}
	},
//	e:DOMInputElement
//	c:int == count
//	t:array(string) == time list
	getSecond:function(e){
		let t=e.value.match(this.format)
		,	c=4
		,	ms=(v,l)=>{
				if(v.constructor==String&&l==1){
					if(v.length>=3)return Number(v);
					if(v.length==2)return Number(v)*10;
					if(v.length==1)return Number(v)*100;
				}
				if(l<=4&&l>0)
					return ms(Number(v)*[60,60,1000,1][4-l],l-1);
				return Number(v);
			};
		switch(''){
			case t[1]:c--;
			case t[2]:c--;
			case t[3]:c--;
			case t[4]:c--;
		}
		return c?(ms(t[1],c)+ms(t[2],c-1)+ms(t[3],c-2)+ms(t[4],c-3))/1000:0;
	},
	msToStr:function(t){
		let ms=Math.floor(t)%1000
		,	s=Math.floor(t/1000)%60
		,	m=Math.floor(t/(60*1000))%60
		,	h=Math.floor(t/(60*60*1000));
		return	(h>9?(h+':'):h>0?('0'+h+':'):'')
			+	(m>9?(m+':'):m>0?('0'+m+':'):h>0?'00:':'')
			+	(s>9?(s+'.'):s>0?('0'+s+'.'):'00.')
			+	(ms>99?ms:ms>9?'0'+ms:'00'+ms);
	},
	IndexedDB:{
		isOpen:false,
		isReqOpen:false,
//		dbreq:null,
//		db:null,
		waitingFunctionList:[],
		openDB:function(){
			if(!window.indexedDB){
				console.log('IndexedDB is not support, no data will be saved.');
			}else if(!this.isOpen&&!this.isReqOpen){
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
			}else if(this.isOpen){
				this.runWaitingFunction();
			}
			this.isReqOpen=true;
		},
		runWaitingFunction:function(){
			let f;
			while(f=this.waitingFunctionList.shift()){
				f.constructor==Function&&f();
			}
		},
		getInfoByVideoID:function(vid,cb){
			this.waitingFunctionList.push(()=>{
				this.db.transaction(['replayRange']).objectStore('replayRange').get(vid).onsuccess=(evt)=>{
					// for Database upgrade
					let r=evt.target.result;
					if(r){
						!r.curMode&&(r.curMode=r.autoPlay?this.parent.mode.loop:this.parent.mode.stop)&&delete r.autoPlay;
						r.end&&(r.to=r.end/1000)&&delete r.end;
						r.start&&(r.from=r.start/1000)&&delete r.start;
						r.to&&!r.from&&(r.from=0);
					}
					cb&&cb.constructor==Function&&cb(r);
				};
			});
			this.openDB();
		},
		setInfo:function(data,cb){
			this.waitingFunctionList.push(()=>{
				this.db.transaction(['replayRange'],'readwrite').objectStore('replayRange').put(data).onsuccess=(evt)=>
					cb&&cb.constructor==Function&&cb(evt.target.result);
			});
			this.openDB();
		},
		init:function(){
			!this.isReqOpen&&this.openDB();
		}
	},
	unload:{
		SaveRecordAndRemoveTimer:function(){
			let p=this.parent;
			if(p.videoID&&p.duration.to){
				p.IndexedDB.setInfo(
					{
						videoID:p.videoID,
						from:p.duration.from,
						to:p.duration.to,
						curMode:p.curMode
					},
					()=>(p.duration={})
				);
			}
			p.setStop();
			p.videoID=null;
		},
		RemoveUIRef:function(){
			this.parent.ui={};
		},
//		changing:false,
		main:function(){
			if(!this.changing){
				this.changing=true;
				for(let x in this){
					this[x].constructor==Function&&this[x]();
				}
				this.changing=false;
			}
		}
	},
	init:{
		SetLayout:function(){
			if(!(this.state.replayer|=0)){
				let e=$('#watch8-secondary-actions');
				if(e){
					let p=this.parent
					,	t=p.text
					,	f=t.TooltipFormat
					,	nE=document.createElement('div')
					,	nEc=nE.children;
					//nE.classList.add('yt-uix-button','yt-uix-button-opacity','yt-uix-button-text');
					nE.style.border='2px solid grey';
					nE.style.borderRadius='10px';
					nE.style.display='inline-block';
								// From (Time Range): index == 0
					nE.innerHTML='<input'
								+	' size=6'
								+	' placeholder="'+t.PlaceHolderFrom+'"'
								+	' title="'+t.TooltipFrom+' - '+f+'"'
								+	' class="yt-uix-tooltip yt-uix-button yt-uix-button-opacity"'
								+	' style="text-align:right;font-size:larger;font-weight:bold"'
								+'>'
								// From (Button): index == 1
								+'<button'
								+	' title="'+t.TooltipFromButton+'"'
								+	' class="yt-uix-tooltip yt-uix-button yt-uix-button-opacity"'
								+	' style="text-align:center;font-size:larger;font-weight:bold"'
								+'>'
								+	t.ButtonFrom
								+'</button>'
								+'<button'
								+	' class="yt-uix-button"'
								+	' style="font-size:larger;font-weight:bold"'
								+'>'
								+	'-'
								+'</button>'
								// To (Button): index == 3
								+'<button'
								+	' title="'+t.TooltipToButton+'"'
								+	' class="yt-uix-tooltip yt-uix-button yt-uix-button-opacity"'
								+	' style="text-align:center;font-size:larger;font-weight:bold"'
								+'>'
								+	t.ButtonTo
								+'</button>'
								// To (Time Range): index == 4
								+'<input'
								+	' size=6'
								+	' placeholder="'+t.PlaceHolderTo+'"'
								+	' title="'+t.TooltipTo+' - '+f+'"'
								+	' class="yt-uix-tooltip yt-uix-button yt-uix-button-opacity"'
								+	' style="text-align:left;font-size:larger;font-weight:bold"'
								+'>'
								// Replayer Action (Button): index == 5
								+'<button'
								+	' title="'+t.TooltipStopToLoop+'"'
								+	' class="yt-uix-tooltip yt-uix-button yt-uix-button-opacity"'
								+	' style="text-align:center;font-size:large;font-weight:bold;width:65px"'
								+'>'
								+	t.Stop
								+'</button>';
					e.insertBefore(nE,e.lastChild);

					let ui=this.parent.ui
					,	keyEvt=(evt)=>
							evt.keyCode==13
							&&p.setRange()
							&&p.toggle(p.curMode!=p.mode.stop?p.curMode:p.mode.crop);

					(ui.fromRange=nEc[0]).addEventListener('keyup',keyEvt,false);
					(ui.aButton=nEc[1]).addEventListener('click',()=>p.setA(),false);
					(ui.bButton=nEc[3]).addEventListener('click',()=>p.setB(),false);
					(ui.toRange=nEc[4]).addEventListener('keyup',keyEvt,false);
					(ui.actionButton=nEc[5]).addEventListener('click',()=>p.setRange()&&p.toggle(),false);

					this.state.replayer=true;
				}
			}
		},
		UpdateInterface:function(){
			if(!(this.state.updateInterface|=0)&&this.state.replayer&&this.state.durationLoaded){
				let p=this.parent;
				setTimeout(()=>(p.ui.ready=true)&&p.updateInterface());
				this.state.updateInterface=true;
			}
		},
		ChangeYouTubeLayout:function(){
			// remove like number
			//let e=$('.like-button-renderer'),eMenu;
			//if(e&&!(this.state.likeDislike=this.state.likeDislike)){
			//	let eC=e.children;
			//	eC[0].children[0].removeChild(eC[0].children[0].children[0]);
			//	eC[2].children[0].removeChild(eC[2].children[0].children[0]);
			//	this.state.likeDislike=true;
			//}

			// move share button to more
			// execute too much time before interface ready
			if(!(this.state.menuList|=0)){
				let e=$('#watch8-secondary-actions'),eMenu=e&&e.querySelector('ul');
				if(eMenu){
					let eC=e.children,eLi=document.createElement('li');
					eC[1].classList.remove('yt-uix-button','yt-uix-button-opacity','yt-uix-button-has-icon','no-icon-markup','yt-uix-tooltip');
					eC[1].classList.add('has-icon','yt-ui-menu-item','yt-uix-menu-close-on-select');
					eLi.appendChild(eC[1]);
					eMenu.insertBefore(eLi,eMenu.children[0]);
					this.state.menuList=true;
				}
			}
		},
		ChangeQuanlity:function(){
			if(!(this.state.playerQuality|=0)){
				let p=this.parent.player;
				if(p){
					p.setPlaybackQuality(p.getAvailableQualityLevels()[0]);
					this.state.playerQuality=p.getPlaybackQuality()==p.getAvailableQualityLevels()[0];
				}
			}
		},
		LoadInfoAndRun:function(){
			if(!(this.state.durationLoading|=0)){
				let p=this.parent;
				p.IndexedDB.init();
				this.state.durationLoading=true;
				this.state.durationLoaded=false;
				p.IndexedDB.getInfoByVideoID(this.state.curVideoID,(info)=>{
					if(info){
						p.duration.from=info.from;
						p.duration.to=info.to;
						p.toggle(info.curMode);
					}
					this.state.durationLoading=this.state.durationLoaded=p.IndexedDB.isReqOpen;
				});
			}
		},
//		changing:false,
//		state:{},
		main:function(){
			let p=this.parent;
			if(!this.changing&&p.isVideoChanged()){
				let newVideoID=p.player.getVideoData().video_id;
				if(newVideoID){
					if(!this.state){
						if(p.videoID){
							p.unload.main();
						}
						this.state={};
						this.state.curVideoID=newVideoID;
						this.main();
					}else{
						let result=true;

						this.changing=true;
						for(let x in this){
							this[x].constructor==Function&&this[x]();
						}
						this.changing=false;

						for(let x in this.state){
							if(!this.state[x]){
								result=false;
								break;
							}
						}

						if(result){
							// allow event trigger
							p.videoID=newVideoID;
							delete this.state;
						}else{
							setTimeout(()=>this.main());
						}
					}
				}
			}
		}
	},
	isVideoChanged:function(){
		return this.videoID!=this.player.getVideoData().video_id;
	},
	start:function(){
		// set parent
		this.IndexedDB.parent=
		this.unload.parent=
		this.init.parent=this;

		let evt='addEventListener'
		,	f=()=>{
				let p=this.player=$('#movie_player')
				,	v=this.video=p&&p.querySelector('video');

				if(p&&v){
					// add all event handle
					let reloadTimer=()=>!this.isVideoChanged()&&this.toggle(this.curMode);
					v[evt]('play',reloadTimer);
					v[evt]('seeked',reloadTimer);
					v[evt]('ratechange',reloadTimer);

					let stopTimer=()=>this.rmTimer();
					v[evt]('pause',stopTimer);
					//v[evt]('stalled',stopTimer);
					v[evt]('suspend',stopTimer);
					v[evt]('waiting',stopTimer);

					let init=()=>this.init.main();
					v[evt]('durationchange',init);
					init();
				}else{
					setTimeout(f);
				}
			};
		f();
		window[evt]('beforeunload',()=>this.unload.main());
	}
}
