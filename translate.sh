MAIN_PROG=`sed -e "/\/\//d" < src/youtube.js | tr -d "\t\r\n" | sed -e "s/ \?true/!0/g" | sed -e "s/ \?false/!1/g" | sed -e "s/'+'//g"`

cat > youtube.js <<END_OF_FILE
{
	let script = document.createElement('script');
	script.innerHTML = "if(!('\$' in window)){$=(a)=>document.querySelector(a)};(${MAIN_PROG}).start();";
	document.head.appendChild(script);
}
END_OF_FILE
