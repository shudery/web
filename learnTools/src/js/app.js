//种子信息平台批量导入工具
//http://iflowseedadmin.test.uae.uc.cn/seedinfo/list
//http://iflowseedmanager.xss.ucweb.local/quality/seed.php?do=addmulti
var cheerio = require('cheerio');
var http = require('http');
var fs = require('fs');

var domainAPI = 'http://napi.ucweb.com/3/classes/seedinfo/indexes/seedinfo/search?_fetch=1&_app_id=d11ebd5026ea4c60b77bcd10b6685221&_page=1&_size=99&_sort=_pos:desc&_objects=name:%22{{seedName}}%22'
	//输入导入的种子名称
var seedName = 'amarujala'
var seedInfoJSON = domainAPI.replace(/{{seedName}}/, seedName)
	//批量导入字符串格式，字段分隔符|, 不同种子分隔符\n
var a = 'seedName|seedUrl|isCp|seedSite|listArticleFrom|seedType|country|city|language|authority|pornSensitivity|politicsSensitivity|seedDeliverStatus|channel|classifyMethod|categoryId|itemType|contentType|daoliuType|seedIconDesc|seedIconUrl|seedClickUrl|styleType|gaId|unionId|business_extend|seedNeedJs|refresh_interval|seed_xpath|black_pattern|white_pattern|crawl_range|crawl_depth|seed_need_linkfollow|seedFormat|crawl_extent'
var seed = []
var seedAll = [];
var seedAllStr = '';
var JSONdata = '';
var channel;
var html = '';

http
	.get(seedInfoJSON, function(res) {
		res.on('data', function(data) {
			html += data;
		})

		res.on('end', function() {
			//生成JSON文件
			fs.writeFile('./seedInfo/seedInfoJSON_' + seedName + '.js', html, function(err, data) {
				if (err) {
					console.log('ERROR!' + err)
				} else {
					console.log('./seedInfo/seedInfoJSON__' + seedName + '.js' + ' already create!')
				}
			})

			var datas = JSON.parse(html).data
			var arr = a.split('|')
			for (var i = 0; i < arr.length; i++) {
				seed.push(arr[i])
			}

			//开始构造字符串
			for (var i = 0; i < datas.length; i++) {
				//传入第一个种子
				var data = datas[i]
					//修改对应频道的映射
				if (+data.channel / 1000 < 1) {
					channel = '00' + parseInt(data.channel / 100)
				} else {
					channel = '0' + parseInt(data.channel / 100)
				}
				//输入种子信息
				seed[0] = data.name // 0seedName|
				seed[1] = data.url // 1seedUrl|
				seed[2] = data.is_cp // 2isCp|
				seed[3] = data.site // 3seedSite|
				seed[4] = data.list_article_from // 4listArticleFrom|
				seed[5] = 0 // 5seedType |
				seed[6] = data.country // 6country|
				seed[7] = data.city // 7city|
				seed[8] = data.language // 8language|
				seed[9] = data.authority // 9authority|
				seed[10] = data.porn_sensitivity // 10pornSensitivity|
				seed[11] = data.politics_sensitivity // 11politicsSensitivity|
				seed[12] = 1 // 12seedDeliverStatus| 种子下发状态
				seed[13] = channel // 13channel|
				seed[14] = 1 // 14classifyMethod|
				seed[15] = data.category // 15categoryId|
				seed[16] = 0 // 16itemType|
				seed[17] = 0 // 17contentType|
				seed[18] = 0 // 18daoliuType|  是否导流
				seed[19] = data.seed_icon_desc // 19seedIconDesc|
				seed[20] = data.seed_icon_url // 20seedIconUrl|
				seed[21] = '' // 21seedClickUrl|
				seed[22] = 0 // 22styleType|
				seed[23] = '' // 23gaId|
				seed[24] = '' // 24unionId|
				seed[25] = '' // 25business_extend|
					// 26seedNeedJs|
				seed[27] = 5 // 27refresh_interval| 抽取间隔
				seed[28] = "" // 28seed_xpath|
				seed[29] = '' // 29black_pattern|
				seed[30] = '' // 30white_pattern|
				seed[31] = 'a' // 31crawl_range|  抓取范围
				seed[32] = 1 // 32crawl_depth|  抓取深度
				seed[33] = 1 // 33seed_need_linkfollow|  需要抽链
				seed[34] = 0 // 34seedFormat| 
				seed[35] = '' // 35crawl_extent
					//整合所有字段
				seedAll.push(seed.join('|'))
			}
			//整合所有种子信息，生成文件
			seedAllStr = seedAll.join('\n')
			fs.writeFile('./seedInfo/seedInfoStr_' + seedName + '.js', seedAllStr, function(err, data) {
				if (err) {
					console.log('ERROR!' + err);
				}
				console.log('./seedInfo/seedInfoStr_' + seedName + '.js' + ' already create!')
			})
		})
	})
	.on('error', function() {
		console.log('there are some error')
	})