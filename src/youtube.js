_=>{
	let $=(q,e=document)=>e.querySelector(q)
	,	isFunc=f=>f&&f.constructor==Function
	// player: <DOMDivElement with player control prototype>
	,	player
	// video: <DOMVideoElement>
	,	video
	,	videoID=''
	,	Enhancer=
	// for debugging use
	window.Enhancer=
	{
		Replayer:{
			mode:{
				stop:1,
				loop:2,
				crop:3
			},
			// timer:null,
			curMode:1,
			format:/^\D*(\d*)\D*(\d*)\D*(\d*)\D*(\d*)\D*$/,
			duration:{
				// this unit is s
				// from:null,
				// this unit is s
				// to:null
			},
			reset:function(){
				video.loop=false;
				this.curMode=this.mode.stop;
				this.duration={};
				this.rmTimer();
			},
			setMode:function(mode){
				if(this.curMode!=mode){
					this.curMode=mode;
					Enhancer.IndexedDB.save();
				}
			},
			setStop:function(){
				video.loop=false;
				this.rmTimer();
				this.setMode(this.mode.stop);
			},
			setLoop:function(){
				this.setMode(this.mode.loop);

				let p=player,curTime=p.getCurrentTime();
				if(this.duration.to<=curTime
				||	curTime<=this.duration.from
				){
					p.seekTo(this.duration.from,true);
				}

				video.loop=true;
				if(this.duration.to+0.001<p.getDuration()){
					this.setTimer(()=>this.setLoop());
				}
			},
			setCrop:function(){
				this.setMode(this.mode.crop);

				let p=player,curTime=p.getCurrentTime();
				if(this.duration.to<=curTime){
					p.seekTo(p.getDuration(),true);
				}else if(curTime+0.05<this.duration.from){
					p.seekTo(this.duration.from,true);
				}

				video.loop=false;
				if(this.duration.to+0.05<p.getDuration()){
					this.setTimer(()=>this.setCrop());
				}
			},
			setRange:function(from,to){
				let s=this.getSecond(from)
				,	e=this.getSecond(to);
				if(e<=0||e>player.getDuration()+1){
					e=player.getDuration();
				}
				if(s<0){
					s=0;
				}
				if(e<s){
					[s,e]=[e,s];
				}
				this.duration.from=s;
				this.duration.to=e;
				this.toggle(this.curMode);
				Enhancer.IndexedDB.save();
			},
			setA:function(){
				this.duration.from=player.getCurrentTime();
				if(!this.duration.to
				||	this.duration.from>this.duration.to
				){
					this.duration.to=player.getDuration();
				}
				this.toggle(this.curMode);
				Enhancer.IndexedDB.save();
			},
			setB:function(){
				this.duration.to=player.getCurrentTime();
				if(!this.duration.from
				||	this.duration.from>this.duration.to
				||	this.duration.from<0
				){
					this.duration.from=0;
				}
				this.toggle(this.curMode);
				Enhancer.IndexedDB.save();
			},
			setTimer:function(f){
				this.rmTimer();
				this.timer=setTimeout(f,(this.duration.to-player.getCurrentTime())*1000/player.getPlaybackRate());
			},
			rmTimer:function(){
				clearTimeout(this.timer);
				this.timer=null;
			},
			toggle:function(mode=(this.curMode+1)%3){
					if(mode==this.mode.loop){
						this.setLoop();
					}else if(mode==this.mode.crop){
						this.setCrop();
					}else{
						this.setStop();
					}
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
		},
		IndexedDB:{
			isOpen:false,
			isReqOpen:false,
	//		dbreq:null,
	//		db:null,
			queue:[],
			openDB:function(){
				if(!window.indexedDB){
					console.log('IndexedDB is not support, no data will be saved.');
				}else if(!this.isOpen&&!this.isReqOpen){
					this.dbreq=window.indexedDB.open('YouTubeReplayer',1);
					this.dbreq.onsuccess=(e)=>{
						this.db=e.target.result;
						this.isOpen=true;
						this.runQueue();
					};
					this.dbreq.onerror=(e)=>0;
					this.dbreq.onupgradeneeded=(evt)=>{
						let db=evt.target.result;
						if(!db.objectStoreNames.contains('replayRange'))
							db.createObjectStore('replayRange',{keyPath:'videoID'});
					};
				}else if(this.isOpen){
					this.runQueue();
				}
				this.isReqOpen=true;
			},
			runQueue:function(){
				let f;
				while(f=this.queue.shift()){
					isFunc(f)&&f();
				}
			},
			getInfoByVideoID:function(vid,cb){
				this.queue.push(()=>{
					this.db.transaction(['replayRange']).objectStore('replayRange').get(vid).onsuccess=(evt)=>{
						// for Database upgrade
						let r=evt.target.result;
						if(r){
							r.to&&!r.from&&(r.from=0);
						}
						isFunc(cb)&&cb(r);
					};
				});
				this.openDB();
			},
			setInfo:function(data,cb){
				this.queue.push(()=>{
					this.db.transaction(['replayRange'],'readwrite').objectStore('replayRange').put(data).onsuccess=(evt)=>
						isFunc(cb)&&cb(evt.target.result);
				});
				this.openDB();
			},
			save:function(){
				let p=Enhancer.Replayer;
				if(videoID){
					this.setInfo(
						{
							videoID,
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
		// 	e:DOMInputElement
		// 	c:int == count
		// 	t:array(string) == time list

		init:{
			ChangeQuality:function(){
				if(!(this.state.playerQuality|=0)){
					this.state.playerQuality=player.getPlaybackQuality()==player.getAvailableQualityLevels()[0];

					let _qi=()=>$('.ytp-settings-menu .ytp-panel-menu .ytp-menuitem path[d^="M15,17h6v1h"]')?.parentNode.parentNode.parentNode;
					let chq=isMenuClosed=>{
						let qi;
						if(qi=_qi()){
							qi.click();
							setTimeout(
								()=>$('.ytp-settings-menu .ytp-quality-menu .ytp-panel-menu .ytp-menuitem')?.click()
								,450
							);
						}else if(!isMenuClosed){
							$('.ytp-settings-button')?.click();
						}
					};
					if(!_qi()){
						let sb=$('.ytp-settings-button');
						if(sb){
							sb.click();
							setTimeout(chq,450);
						}
					}else{
						chq(true);
					}
				}
			},
			LoadInfoAndRun:function(){
				if(!(this.state.durationLoading|=0)){
					Enhancer.IndexedDB.init();
					this.state.durationLoading=true;
					this.state.durationLoaded=false;
					let p=Enhancer.Replayer;
					Enhancer.IndexedDB.getInfoByVideoID(this.state.curVideoID,info=>{
						if(info){
							p.duration.from=info.from;
							p.duration.to=info.to;
							p.toggle(info.curMode);
						}
						this.state.durationLoaded=true;
					});
				}
			},
			// changing:false,
			// state:{},
			main:function(){
				let newVideoID=player.getVideoData().video_id;
				if(this.state&&this.state.curVideoID!=newVideoID){
					this.changing=false;
					delete this.state;
				}
				if(!this.changing&&Enhancer.isVideoChanged()){
					if(!this.state){
						videoID='';
						this.state={};
						this.state.curVideoID=newVideoID;
						// reset setting
						Enhancer.Replayer.reset();
					}

					if(newVideoID){
						if(player.getPlayerState()==1){
							let result=true;

							this.changing=true;
							for(let x in this){
								isFunc(this[x])&&this[x]();
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
								videoID=newVideoID;
								return delete this.state;
							}
						}
						setTimeout(()=>this.main(),500);
					}
				}
			}
		},
		isVideoChanged:_=>videoID!=player.getVideoData().video_id,
		start:function(){
			let evt='addEventListener'
			,	f=()=>{
					let p=player=$('#movie_player')
					,	v=video=$('video',p);

					if(p&&v){
						// add all event handle
						let reloadTimer=()=>!this.isVideoChanged()&&this.Replayer.toggle(this.Replayer.curMode);
						// v[evt]('play',reloadTimer);
						// v[evt]('playing',reloadTimer);
						v[evt]('seeked',reloadTimer);
						v[evt]('ratechange',reloadTimer);

						// let stopTimer=()=>this.rmTimer();
						// v[evt]('pause',stopTimer);
						// v[evt]('stalled',stopTimer);
						// v[evt]('suspend',stopTimer);
						// v[evt]('waiting',stopTimer);

						let init=()=>setTimeout(()=>this.init.main(),200);
						v[evt]('durationchange',init);
						init();
					}else{
						setTimeout(f,1000);
					}
				};
			f();
		}
	};
	Enhancer.start();
}