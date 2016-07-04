MAIN_PROG=`sed -e "/\/\//d" < src/youtube.js |  tr -d "\t\r\n"`

cat > youtube.js <<END_OF_FILE
(function init(){
	var script = document.createElement('script');
	script.innerHTML = "${MAIN_PROG};if(!('\$' in window)){$=function(a){return document.querySelector(a)}};setTimeout(Replayer.init.main);document.body.addEventListener('load',Replayer.init.main,true)";
	try{
		document.querySelector('head').appendChild(script);
	}catch(newE){
		console.log('Error Occur when initializing Replayer: ', newE);
	}
})();
END_OF_FILE
