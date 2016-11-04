TMP_MAIN_PROG=''
MAIN_PROG=$(sed -e "/\/\//d" < src/youtube.js | tr -d "\t\r\n" | sed -e "s/'+'//g" | sed -e "s/ \?true/!0/g" | sed -e "s/ \?false/!1/g" | sed -e "s/else{/else {/g")
while [ "$TMP_MAIN_PROG" != "$MAIN_PROG" ]; do
	TMP_MAIN_PROG=$MAIN_PROG
	MAIN_PROG=$(sed -e "s/{\([^:;{}]\+;\)}/\1/g" <<< "$MAIN_PROG" | sed -e "s/\(function *([^)]*)\)\([^{;]\+;\)/\1{\2}/g")
done
MAIN_PROG=$(sed -e "s/else {/else{/g" <<< "$MAIN_PROG" | sed -e "s/;}/}/g" | sed -e "s/;)/)/g" | sed -e "s/Math\.floor/~~/g")

cat > youtube.js <<END_OF_FILE
{
	let script = document.createElement('script');
	script.innerHTML = "'use strict';if(!('\$' in window)){window.$=(a)=>document.querySelector(a)};(${MAIN_PROG}).start();";
	document.head.appendChild(script);
}
END_OF_FILE
