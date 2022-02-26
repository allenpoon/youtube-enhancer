// for debugging use
window.Replayer=
{
	// text:{
	// 	Loop:'├⭮┤',
	// 	Crop:'├⏵┤',
	// 	Stop:'⏵',
	// 	ButtonFrom:'A',
	// 	ButtonTo:'B',
	// 	PlaceHolderFrom:'From',
	// 	PlaceHolderTo:'To',
	// 	TooltipFromButton:'Set now as the start',
	// 	TooltipToButton:'Set now as the end',
	// 	TooltipLoopToCrop:'Looping; Click to Crop',
	// 	TooltipCropToStop:'Cropped; Click to Normal',
	// 	TooltipStopToLoop:'Normal; Click to Loop',
	// 	TooltipFormat:'[ [ [ [ h: ] m: ] s. ] ms ]',
	// 	TooltipFrom:'Start',
	// 	TooltipTo:'End'
	// },
// 	ui:{
// //		fromRange: <DOMInputElement>,
// //		toRange: <DOMInputElement>,
// //		aButton: <DOMButtonElement>,
// //		bButton: <DOMButtonElement>,
// //		actionButton: <DOMButtonElement>,
// 	},
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
		this.IndexedDB.save();
		this.video.loop=false;
		this.rmTimer();
	},
	setLoop:function(){
		this.curMode=this.mode.loop;
		this.IndexedDB.save();

		let p=this.player;
		if(	this.duration.to<=p.getCurrentTime()
		||	p.getCurrentTime()<=this.duration.from
		){
			p.seekTo(this.duration.from,true);
		}

		this.video.loop=true;
		if(	this.duration.to+0.001<p.getDuration()){
				this.setTimer(()=>this.setLoop());
		}
	},
	setCrop:function(){
		this.curMode=this.mode.crop;
		this.IndexedDB.save();

		let p=this.player;
		if(	this.duration.to<=p.getCurrentTime()
		&&	p.getPlayerState()===1
		){
			p.seekTo(p.getDuration(),true);
		}else if(p.getCurrentTime()+0.05<this.duration.from){
			p.seekTo(this.duration.from,true);
		}

		this.video.loop=false;
		if(this.duration.to+0.05<p.getDuration()){
				this.setTimer(()=>this.setCrop());
		}
	},
	setTimer:function(f){
		this.rmTimer();
		this.timer=setTimeout(f,(this.duration.to-this.player.getCurrentTime())*1000/this.player.getPlaybackRate());
	},
//	Return change of time range
	setRange:function(from,to){
		// if(!this.ui.ready)	return false;

		// let s=this.getSecondFromElement(this.ui.fromRange)
		// ,	e=this.getSecondFromElement(this.ui.toRange);
		let s=this.getSecond(from)
		,	e=this.getSecond(to);
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
		this.IndexedDB.save();
		return true;
	},
	setA:function(){
		this.duration.from=this.player.getCurrentTime();
		if(!this.duration.to
		||	this.duration.from>this.duration.to
		){
			this.duration.to=this.player.getDuration();
		}
		this.IndexedDB.save();
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
		this.IndexedDB.save();
		this.toggle(this.curMode);
	},
	rmTimer:function(){
		clearTimeout(this.timer);
		this.timer=null;
	},
	toggle:function(mode){
			if(mode==this.mode.loop||(!mode&&this.curMode==this.mode.stop)){
				this.setLoop();
			}else if(mode==this.mode.crop||(!mode&&this.curMode==this.mode.loop)){
				this.setCrop();
			}else{
				this.setStop();
			}
//		}
	},
//	e:DOMInputElement
//	c:int == count
//	t:array(string) == time list
	getSecondFromElement:function(e){
		return this.getSecond(e.value);
	},
	getSecond:function(s=''){
		let t=String(s).match(this.format)
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
		parent:{},
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
		save:function(){
			let p=this.parent;
			if(p.videoID){
				p.IndexedDB.setInfo(
					{
						videoID:p.videoID,
						from:p.duration.from,
						to:p.duration.to,
						curMode:p.curMode
					}
				);
			}
		},
		init:function(){
			!this.isReqOpen&&this.openDB();
		}
	},
	init:{
		ChangeQuanlity:function(){
			if(!(this.state.playerQuality|=0)){
				let p=this.parent.player;
				this.state.playerQuality=p.getPlaybackQuality()==p.getAvailableQualityLevels()[0];

				let _qi=()=>$('.ytp-settings-menu .ytp-panel-menu').lastElementChild;
				let chq=()=>{
					let qi=_qi();
					qi&&qi.click();
					setTimeout(()=>{
						let hqi=$('.ytp-settings-menu .ytp-quality-menu .ytp-panel-menu .ytp-menuitem');
						hqi&&hqi.click();
					}, 200);
				};
				setTimeout(()=>{
					if(!_qi()){
						let sb=$('.ytp-settings-button');
						if(sb){
							sb.click();
							setTimeout(()=>{
								sb.click();
								setTimeout(chq,200);
							},200);
						}
					}else{
						chq();
					}
				}, 200);
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
					this.state.durationLoaded=true;
				});
			}
		},
//		changing:false,
//		state:{},
		main:function(){
			let p=this.parent;
			let newVideoID=p.player.getVideoData().video_id;
			if(this.state&&this.state.curVideoID!=newVideoID){
				this.changing=false;
				delete this.state;
			}
			if(!this.changing&&p.isVideoChanged()){
				if(newVideoID){
					if(!this.state){
						p.unload.main();
						this.state={};
						this.state.curVideoID=newVideoID;
					}

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
						setTimeout(()=>this.main(),1000);
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
		this.init.parent=this;

		let evt='addEventListener'
		,	f=()=>{
				let p=this.player=$('#movie_player')
				,	v=this.video=p&&p.querySelector('video');

				if(p&&v&&p.getPlayerState()==1){
					// add all event handle
					// let reloadTimer=()=>!this.isVideoChanged()&&this.toggle(this.curMode);
					// v[evt]('play',reloadTimer);
					// v[evt]('playing',reloadTimer);
					// v[evt]('seeked',reloadTimer);
					// v[evt]('ratechange',reloadTimer);

					// let stopTimer=()=>this.rmTimer();
					// v[evt]('pause',stopTimer);
					// v[evt]('stalled',stopTimer);
					// v[evt]('suspend',stopTimer);
					// v[evt]('waiting',stopTimer);

					let init=()=>this.init.main();
					v[evt]('durationchange',init);
					init();
				}else{
					setTimeout(f,1000);
				}
			};
		f();
	}
}
