echo -n 'replayerBody="{' > youtube.js
tail -n +2 src/youtube.js | sed -e "s/\t//g" | sed -e "/\/\//d" |  tr -d "\n" >> youtube.js
echo '";' >> youtube.js
echo "function init(){" >> youtube.js
echo "		var script = document.createElement('script');" >> youtube.js
echo "		script.innerHTML = 'Replayer='+replayerBody+';setInterval(Replayer.init.main,2000);';" >> youtube.js
echo "		try{" >> youtube.js
echo "			document.querySelector('head').appendChild(script);" >> youtube.js
echo "		}catch(newE){" >> youtube.js
echo "			console.log('Error Occur when initializing Replayer: ', newE);" >> youtube.js
echo "			return;" >> youtube.js
echo "		}" >> youtube.js
echo "}" >> youtube.js
echo "setTimeout(init,0);" >> youtube.js