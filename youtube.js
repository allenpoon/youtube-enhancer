function init1(){
	var newE = document.createElement('div');
	newE.style.position = 'fixed';
	newE.style.height ='101%';
	newE.style.width='101%';
	newE.style.top='-1px';
	newE.style.left='-1px';
	newE.style.zIndex='9999999';
	newE.innerHTML="<div style='height:100%; width:100%; position:relative;' onmouseover=\"this.parentNode.parentNode.removeChild(this.parentNode);if(!window.replayer){window.replayer = {'setTimeoutTimer':function (){this.rmTimer();var player=window.document.getElementById('movie_player');var e = document.getElementById('replayToggle');e.innerHTML='Stop';e.title='End Repeat';e.dataset.tooltipText='End Repeat';this.duration.start = this.getSecond(window.document.getElementById('replayerTimerFrom'));this.duration.end = this.getSecond(window.document.getElementById('replayerTimerTo'));if(this.duration.end <=0){this.duration.end = player.getDuration()*1000;}if(this.duration.end < this.duration.start){var tmp = this.duration.start;this.duration.start = this.duration.end;this.duration.end = tmp;}if(this.duration.start < 0){this.duration.start = 0;}if(this.duration.end > player.getDuration()*1000){this.duration.end = player.getDuration()*1000;}if(player.getPlayerState() === 1 && this.duration.end-player.getCurrentTime()*1000 > 0 && player.getCurrentTime()*1000-this.duration.start >= 0){window.replayer.timer.timeout = setTimeout(function (){window.replayer.timer.timeout = setTimeout(function (){window.replayer.setIntervalTimer()},window.replayer.duration.end-player.getCurrentTime()*1000)},2000);}else{this.setIntervalTimer();}},'setIntervalTimer' : function(){this.rmTimer();var player = window.document.getElementById('movie_player');player.seekTo(replayer.duration.start/1000, true);if(player.getPlayerState()===2){player.playVideo();}window.replayer.timer.timeout = setTimeout(function (){if(player.getPlayerState() === 1){window.replayer.timer.timeout = setTimeout(function (){window.replayer.setIntervalTimer()},window.replayer.duration.end-player.getCurrentTime()*1000)}else{window.replayer.setIntervalTimer()}},2000);},'rmTimer' : function (){window.clearTimeout(this.timer.timeout);this.timer.timeout=null;},'toggle' : function (){var e = document.getElementById('replayToggle');if(e.innerHTML=='Loop'){this.setTimeoutTimer();}else{this.rmTimer();e.innerHTML='Loop';e.title='Start Repeat';e.dataset.tooltipText='Start Repeat';}},'toSecond':function (value, level){var newValue = 0;if(level <=3 && level >0){var secondConstant=[60,60,1];newValue = Number(value)*secondConstant[3-level] + this.toSecond(newValue, level-1);}return newValue;},'getSecond':function (e) {var time = e.value.match(/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/);var count=3;switch(''){case time[1]:count--;case time[2]:count--;case time[3]:count--;}return !!count?(this.toSecond(time[1], count) + this.toSecond(time[2], count-1) + this.toSecond(time[3], count-2))*1000:0;},'timer' : {'timeout' : null},'duration' : {'start' : null,'end' : null}}}else{window.replayer.rmTimer();}\"></div>";
	try{
		document.body.appendChild(newE);
		clearInterval(timer_1);
	}catch(newE){
		return;
	}
}
function init2(){
	var e = window.document.getElementById('watch-like-dislike-buttons');
	var a;
	a ='<span><input placeholder="From" size="1" title="Start, (H)(M)(S)<br>/^\\D*(\\d*)\\D*(\\d*)\\D*(\\d*)\\D*$/" class="yt-uix-tooltip yt-uix-button yt-uix-button-text" style="text-align:center" id="replayerTimerFrom" onkeyup="if(window.event.keyCode==13){window.replayer.setTimeoutTimer();};" /></span>';
	a+='<span><input placeholder="To" size="1" title="End, (H)(M)(S)<br>/^\\D*(\\D*)\\D*(\\d*)\\D*(\\d*)\\D*$/" class="yt-uix-tooltip yt-uix-button yt-uix-button-text" style="text-align:center" id="replayerTimerTo" onkeyup="if(window.event.keyCode==13){window.replayer.setTimeoutTimer();};" /></span>';
	a+='<span><button id="replayToggle" title="Start Repeat" class="yt-uix-tooltip yt-uix-button yt-uix-button-text" onclick="window.replayer.toggle();" />Loop</button></span>';
	!!e && (e.innerHTML+=a) && clearInterval(timer_2);
}
function init3 (){
	var e=document.getElementById('movie_player');
	e.setPlaybackQuality(e.getAvailableQualityLevels()[0]) && clearInterval(timer_3);
}
function init4(){
	var e=document.getElementById('watch-like-dislike-buttons').querySelector('.yt-uix-button-content');
	!!e && e.parentNode.removeChild(e) && clearInterval(timer_4);
}
function init5(){
	var e=document.getElementById('watch7-secondary-actions').querySelector('.yt-uix-button-icon-action-panel-report').parentNode.parentNode.parentNode;
	!!e && e.parentNode.removeChild(e) && clearInterval(timer_5);
	
}
function init6(){
	var e=document.getElementById('watch7-secondary-actions').querySelector('.yt-uix-button-icon-action-panel-stats').parentNode.parentNode.parentNode;
	!!e && e.parentNode.removeChild(e) && clearInterval(timer_6);
}
function init7(){
	var e=document.getElementById('watch-like');
	!!e && (e.style.padding="0 5px") && (e.querySelector('span').style.margin='0') && (e.querySelector('.yt-uix-button-icon').style.margin='0') && clearInterval(timer_7);
}

a = timer_1 = timer_2 = timer_3 = timer_4 = timer_5 = timer_6 = timer_7 = 0;

setInterval(function (){
	if(a != location.href){
		clearInterval(timer_1);
		clearInterval(timer_2);
		clearInterval(timer_3);
		clearInterval(timer_4);
		clearInterval(timer_5);
		clearInterval(timer_6);
		clearInterval(timer_7);

		timer_1 = setInterval(init1,1000);
		timer_2 = setInterval(init2,1000);
		timer_3 = setInterval(init3,1000);
		timer_4 = setInterval(init4,1000);
		timer_5 = setInterval(init5,1000);
		timer_6 = setInterval(init6,1000);
		timer_7 = setInterval(init7,1000);
		a = location.href;
	}
}, 1000);
/*
window.replayer = {
	'setTimeoutTimer':function (){
		this.rmTimer();
		var player=window.document.getElementById('movie_player');
		var e = document.getElementById('replayToggle');
		e.innerHTML='Stop';
		e.title='End Repeat';
		e.dataset.tooltipText='End Repeat';


		this.duration.start = this.getSecond(window.document.getElementById('replayerTimerFrom'));
		this.duration.end = this.getSecond(window.document.getElementById('replayerTimerTo'));
		if(this.duration.end < this.duration.start){
			var tmp = this.duration.start;
			this.duration.start = this.duration.end;
			this.duration.end = tmp;
		}
		if(this.duration.start < 0){
			this.duration.start = 0;
		}
		if(this.duration.end <=0 || this.duration.end > player.getDuration()*1000){
			this.duration.end = player.getDuration()*1000;
		}
		if(player.getPlayerState() === 1 && this.duration.end-player.getCurrentTime()*1000 > 0 && player.getCurrentTime()*1000-this.duration.start >= 0){
			window.replayer.timer.timeout = setTimeout(function (){window.replayer.timer.timeout = setTimeout(function (){window.replayer.setIntervalTimer()},window.replayer.duration.end-player.getCurrentTime()*1000)},1000);
		}else{
			this.setIntervalTimer();
		}
	},
	'setIntervalTimer' : function(){
		this.rmTimer();
		var player = window.document.getElementById('movie_player');
		player.seekTo(replayer.duration.start/1000, true);
		if(player.getPlayerState()===2){
			player.playVideo();
		}
		window.replayer.timer.timeout = setTimeout(function (){if(player.getPlayerState() === 1){window.replayer.timer.timeout = setTimeout(function (){window.replayer.setIntervalTimer()},window.replayer.duration.end-player.getCurrentTime()*1000)}else{window.replayer.setIntervalTimer()}},1000);
	},
	'rmTimer' : function (){
		window.clearTimeout(this.timer.timeout);
		this.timer.timeout=null;
	},
	'toggle' : function (){
		var e = document.getElementById('replayToggle');
		if(e.innerHTML=='Loop'){
			this.setTimeoutTimer();
		}else{
			this.rmTimer();
			e.innerHTML='Loop';
			e.title='Start Repeat';
			e.dataset.tooltipText='Start Repeat';
		}
	},
// anonymous functions and variable
	'toSecond':function (value, level){
		var newValue = 0;
		if(level <=3 && level >0){
			var secondConstant=[60,60,1];
			newValue = Number(value)*secondConstant[3-level] + this.toSecond(newValue, level-1);
		}
		return newValue;
	},
	'getSecond':function (e) {
		var time = e.value.match(/^\D*(\d*)\D*(\d*)\D*(\d*)\D*$/);
		var count=3;
		switch(''){
			case time[1]:
				count--;
			case time[2]:
				count--;
			case time[3]:
				count--;
		}
		return !!count?(this.toSecond(time[1], count) + this.toSecond(time[2], count-1) + this.toSecond(time[3], count-2))*1000:0;
	},
	'timer' : {'timeout' : null},'duration' : {'start' : null,'end' : null}
}
*/