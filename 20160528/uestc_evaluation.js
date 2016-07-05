	for (var i = 0; i < 4; i++) {
		var list = $('#evaluateEditForm .gridtable tbody').find('tr').eq(i).find('input').eq(0);
		list.click();
	};
	$('#evaluateEditForm li.foot #btnSave').click()
// var teacherNum = $('.gridtable tbody tr').length;
// for (var n = 0; n < teacherNum; n++) {
// 	if (/未评教/.test($('.gridtable tbody tr').eq(n).find('td').eq(4))) {
// 		$('.gridtable tbody tr').eq(n).find('td').eq(5).click();
// 		setTimeou(evaluation, 500);
// 	}
// }