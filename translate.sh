echo -n 'replayerBody="' > youtube.js
sed -e "/\/\//d" < src/youtube.js |  tr -d "\t\r\n" >> youtube.js
echo '";' >> youtube.js
echo "function init(){" >> youtube.js
echo "		var script = document.createElement('script');" >> youtube.js
echo "		script.innerHTML = replayerBody+';if(!(\"\$\" in window)){$=function(a){return document.querySelector(a)}};setInterval(Replayer.init.main,2000);';" >> youtube.js
echo "		try{" >> youtube.js
echo "			document.querySelector('head').appendChild(script);" >> youtube.js
echo "		}catch(newE){" >> youtube.js
echo "			console.log('Error Occur when initializing Replayer: ', newE);" >> youtube.js
echo "			return;" >> youtube.js
echo "		}" >> youtube.js
echo "}" >> youtube.js
echo "setTimeout(init,0);" >> youtube.js
