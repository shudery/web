// 遍历DOM中所有的样式表
// 遍历每一个样式表中的每一条规则

var sheet = document.styleSheets
for (var i = 0; i < sheet.length; i++) {
	for (var n = 0; n < sheet[i].rules.length; n++) {
		if (sheet[i].rules[n].selectorText == 'body') {
			console.log('tag:' + sheet[i].rules[n].style.cssText);
		}
	}
}

// 要想知道某个元素在页面上的偏移量，将这个元素的offsetLeft 和offsetTop 
// 与其offsetParent的相同属性相加，如此循环直至根元素，就可以得到一个基本准确的值
// 以下两个函数就可以用于分别取得元素的左和上偏移量

function getElementLeft(element) {
	var actualLeft = element.offsetLeft;
	var current = element.offsetParent;
	while (current !== null) {
		actualLeft += current.offsetLeft;
		current = current.offsetParent;
	}
	return actualLeft;
}