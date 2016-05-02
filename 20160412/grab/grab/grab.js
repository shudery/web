var _ = require('underscore'),
    cheerio = require('cheerio'),
    Entities = require('html-entities').AllHtmlEntities,
    iconv = require('iconv-lite'),
    log4js = require('log4js'),
    request = require('request'),
    Promise = require('bluebird'),

    // 块元素标签
    blockTag = [
        'p','div', 'center', 'pre',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],

    // 默认编码
    ENCODING = 'utf-8',

    defaultOptions = {
        // 执行超时时间
        timeout: 5000,
        // 代理配置
        proxy: null,
        // 失败重试次数
        retries: 0,
        // 自动检测页面编码，默认开
        detectEncoding: true,
        // 默认编码配置
        encoding: ENCODING,
        // 跟随 3xx 跳转，默认为 true
        followRedirect: true,
        // 解码 HTML 实体，默认开
        decodeEntities: true,
        // 忽略错误，继续执行，默认关
        ignoreError: false,
        // 排除 HTML 特定的标签，比如排除 <i>
        excludeHtmlTag: [],
        // 排除 HTML 特定的属性
        excludeHtmlAttr: []
    },

    // 日志等级常量
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',

    // 日志等级
    logLevels = [DEBUG, INFO, WARN, ERROR];

// 配置单个日志
var logger = {
    debug: log4js.getLogger(DEBUG),
    info: log4js.getLogger(INFO),
    warn: log4js.getLogger(WARN),
    error: log4js.getLogger(ERROR)
};

// HTML 错误
function HtmlError(message, stack) {
  this.name = 'HtmlError';
  this.message = message;
  this.stack = stack;
}
HtmlError.prototype = Object.create(Error.prototype);
HtmlError.prototype.constructor = HtmlError;

// JSON 错误
function JsonError(message, stack) {
  this.name = 'JsonError';
  this.message = message;
  this.stack = stack;
}
JsonError.prototype = Object.create(Error.prototype);
JsonError.prototype.constructor = JsonError;

// 网络错误
function NetworkError(message, stack) {
  this.name = 'NetworkError';
  this.message = message;
  this.stack = stack;
}
NetworkError.prototype = Object.create(Error.prototype);
NetworkError.prototype.constructor = NetworkError;

// 运行时错误
function RuntimeError(message, stack) {
  this.name = 'RuntimeError';
  this.message = message;
  this.stack = stack;
}
RuntimeError.prototype = Object.create(Error.prototype);
RuntimeError.prototype.constructor = RuntimeError;

// 是否是块元素
function isBlockTag(name) {
    return blockTag.indexOf(name) > -1;
}

// 提取请求返回 response 中的信息
function extractResponseInfo(res) {
    if (!res) {
        return res;
    } else {
        return {
                statusCode: res.statusCode,
                headers: res.headers,
                request: {
                    method: res.request && res.request.method,
                    headers: res.request && res.request.headers,
                    uri: res.request && res.request.uri
                }
            };
    }
}

// 调用 iconv 进行解码
function decode(content, encoding) {
    if (!encoding) {
        encoding = ENCODING;
    }
    return iconv.decode(content, encoding);
}

// 创建异常捕获的回调方法
function createCatchCallback(fn, context, next) {
    return function () {
        var args = Array.prototype.slice.call(arguments);
        args.push(context);
        args.push(next);
        fn.apply(this, args);
    };
}

// 准备执行请求
function req(context, options, resolve, reject) {
    if (!context) {
        reject(new RuntimeError('EMPTY_CONTEXT'));
        return;
    }
    if (!options) {
        reject(new RuntimeError('EMPTY_OPTIONS'));
        return;
    }

    // 复制一份配置
    var requestOptions = _.extend({}, options),
        fields = [],
        promises = [];

    // 发现有 Promise ，需要先执行 Promise
    _.each(requestOptions, function (value, key) {
        if (value && value.toString().indexOf('Promise') > -1) {
            fields.push(key);
            promises.push(value);
        }
    });

    // 如果参数中存在 promise ，则等待完成后再请求数据
    if (promises.length > 0) {
        // 插入 promises 的结果处理方法
        promises.push(function () {
            // 收集会所有 promise 的返回值
            var results = Array.prototype.slice.apply(arguments);

            // 遍历出配置中的键并重新赋值
            _.each(fields, function (key, index) {
                requestOptions[key] = results[index];
            });

            // 发出真正的请求吧！
            doReq(context, requestOptions, resolve, reject);
        });

        // 执行拼接 promise
        // Promise.join 见 http://bluebirdjs.com/docs/api/promise.join.html
        Promise.join.apply(Promise, promises)
        .catch(function (err) {
            reject(new RuntimeError('PROMISE_REQUEST_OPTIONS_ERROR', err.stack));
        });

    // 不存在 promise，直接请求数据
    } else {
        doReq(context, requestOptions, resolve, reject);
    }
}

// 执行请求
// 根据给定的参数获取相对应的页面并使用 cheerio 解析
function doReq(context, options, resolve, reject) {
    var encoding = options.encoding || ENCODING,
        followRedirect = options.followRedirect,
        responses = [];

    // 设置 encoding 为 null，使返回的数据是 buffer
    options.encoding = null;
    // 替换请求中的 followRedirect ，并记录每次的返回信息
    options.followRedirect = function (res) {
        responses.push(extractResponseInfo(res));
        return followRedirect;
    };

    // 按照配置进行请求
    request(options, function (err, res, body) {
        // 提取请求返回的信息
        if (followRedirect) {
            responses.push(extractResponseInfo(res));
        }

        // 处理异常
        if (err || !res) {
            if (err.code === 'ETIMEDOUT') {
                reject(new NetworkError('CONNECT_TIMEOUT', err.stack));
            } else if (err.code === 'ECONNREFUSED') {
                reject(new NetworkError('CONNECT_REFUSED', err.stack));
            } else if (err.message.indexOf('Invalid URI') > -1) {
                reject(new NetworkError('INVALID_URI', err.stack));
            } else {
                reject(new NetworkError(err.code, err.stack));
            }
            return;
        }
        if (res.statusCode !== 200) {
            reject(new NetworkError('STATUS_CODE_' + res.statusCode));
            return;
        }
        if (!body) {
            reject(new HtmlError('EMPTY_CONTENT'));
            return;
        }

        // 提取必要的信息并补充到上下文中
        var headers = res.headers,
            contentType = headers['content-type'];

        // 将请求地址放到上下文中
        context.url = options.url || options.uri
        // 将每次的请求返回放入到上下文中
        context.responses = responses;
        // 将请求返回放到上下文中
        context.response = res;
        // 将请求的 header 放到上下文中
        context.headers = headers;
        // 提取 content type
        context.contentType = contentType ? contentType.toLowerCase() : 'html';

        // 识别 HTML
        if (context.contentType.indexOf('html') > -1) {
            context.contentType = 'html';

        // 识别 JSON
        } else if (context.contentType.indexOf('json') > -1) {
            context.contentType = 'json';
        
        // 识别 JavaScript
        } else if (context.contentType.indexOf('javascript')) {
            context.contentType = 'javascript';
        }

        // 没有指定编码
        // 自动辨别编码
        // HTML4 <meta http-equiv="Content-Type" content="text/html;charset=ISO-8859-1">
        // HTML5 <meta charset="UTF-8">
        if (options.detectEncoding) {
            var contentEncoding,
                rChartset = [
                    /charset=['"]?([\w-\d]+)['"]?/,
                    /encoding=['"]?([\w-\d]+)['"]?/
                ];

            _.each(rChartset, function (r) {
                if (!contentEncoding) {
                    contentEncoding = r.exec(body);
                    if (contentEncoding) {
                        contentEncoding = contentEncoding[1];
                    }
                }
            })

            if (contentEncoding) {
                encoding = contentEncoding;
            }
        }

        // 尝试对返回内容进行编码解码
        try {
            body = decode(body, encoding);
        } catch(err) {
            reject(new HtmlError('DECODE_ERROR', err.stack));
            return;
        }
        // 将页面内容放到上下文中
        context.content = body;

        // 处理 HTML
        if (context.contentType === 'html') {
            // 解析页面
            parseHtml(context)
            .then(function () {
                // 解析页面出错，抛出异常
                if (!context.$root) {
                    reject(new HtmlError('UNKNOW_DOC_TYPE'));
                } else {
                    resolve();
                }
            })
            .catch(reject);

        // 处理 JSON
        } else if (context.contentType === 'json') {
            try {
                context.data = JSON.parse(context.content);
                resolve();
            } catch(err) {
                reject(err);
            }

        // 处理 JavaScript
        } else if (context.contentType === 'javascript') {
            // 尝试转换成 JSON, 如果出错就算了
            try {
                context.data = JSON.parse(context.content);
            } catch(err) {
                context.data = {};
            }
            resolve();

        // 无法处理的文档
        } else {
            reject(new RuntimeError('UNKNOW_DOC_TYPE'));
        }
    });
}

// 翻页处理逻辑
function page(context, options, resolve, reject) {
    var nextIndex = context.nextIndex++,
        $ = context.$,
        $root = context.$root,
        paging = options.paging,
        queue = paging.queue,
        handler = paging.handler,
        next = paging.next,
        selector = next.selector,
        limitSelector = next.limitSelector,
        limit = next.limit,
        url;

    // 如果没有限制的数值，则需要先获取
    if (!limit) {
        if (queue) {
            limit = next.limit = queue.length;
        } else if (limitSelector) {
            var limitValue = extractValue($, $root, limitSelector);
            if (limitValue
                && limitValue[0]) {
                limit = next.limit = Number(limitValue[0]);
            }
            if (isNaN(limit)
                && limitValue
                && limitValue[0]) {
                limit = next.limit = limitValue[0];
            }
        }
    }

    // 默认只能为 0 了
    if (!limit) {
        limit = next.limit = 0;
    }

    // 分页结束
    if (_.isNumber(limit)
        && nextIndex >= limit) {
        context.nextIndex = 0;
        resolve();
        return;
    }

    // 分页开始

    // 如果是有队列，则执行队列
    if (queue) {
        url = queue[nextIndex];

    // 如果是选择器，则选择元素并判断
    } else if (selector) {
        var urlValue = extractValue($, $root, selector);
        url = urlValue && urlValue[0];
    }

    if (handler) {
        url = handler.call(context, url, limit);
    }

    // 拿到 URL，请求页面
    if (url) {
        // 修改队列起始位置，重新回到抓取页面的状态
        context.queueIndex = context.queueStart;

        // 请求相应的地址并重新处理
        options.url = url;
        req(context, options, resolve, reject);

    // 没有 URL，退出分页
    } else {
        resolve();
    }
}

// 修正 Html 中的问题
function fixHtml(content) {
    // 替换掉 <noindex> <nofollow> 的标签
    content = content.replace(/<\/?(noindex|nofollow)>/ig, '');
    // 替换掉 IE Hack
    content = content.replace(/(<!--\[if[^\]]*\]>|<\!\[endif\]-->)/ig, '');

    content = fixDoctypeTag(content);   
    content = fixHeadTag(content);
    content = fixBodyTag(content);
    content = fixHtmlTag(content);

    return content;
}

function fixDoctypeTag(content) {
    var _content = content.toLowerCase(),
        begin = _content.indexOf('<!doctype'),
        hasBegin = begin > -1;

    if (!hasBegin) {
        content = '<!DOCTYPE html>' + content;
    }

    return content;
}

function fixHtmlTag(content) {
    var _content = content.toLowerCase(),
        begin = _content.indexOf('<html'),
        hasBegin = begin > -1,
        end = _content.indexOf('</html>'),
        hasEnd = end > -1;

    if (!hasBegin) {
        content = content.replace(/<head>/i, '<html><head>');
    }

    begin = content.indexOf('<html');
    hasBegin = begin > -1;
    if (!hasBegin) {
        content = content.replace(/<!DOCTYPE[^>]*>/i, '<!DOCTYPE html><html>');
    }

    if (!hasEnd) {
        content += '</html>';
    }

    return content;
}

function fixHeadTag(content) {
    var _content = content.toLowerCase(),
        begin = _content.indexOf('<head'),
        hasBegin = begin > -1;

    if (!hasBegin) {
        content = content.replace(/<meta/i, '<head><meta');
    }

    return content;
}

function fixBodyTag(content) {
    var _content = content.toLowerCase(),
        begin = _content.indexOf('<body'),
        hasBegin = begin > -1,
        end = _content.indexOf('</body>'),
        hasEnd = end > -1;

    if (!hasBegin) {
        content = content.replace(/<\/head>/i, '</head><body>');
    }

    if (!hasEnd) {
        content += '</body>';
    }

    return content;
}

// 将文档转化为 cheerio 对象
function parseHtml(context, options) {
    return new Promise(function (resolve, reject) {
        if (!context) {
            reject(new HtmlError('PARSE_ERROR'));
            return;
        }

        var content = context.content;
        if (!_.isString(content)) {
            reject(new HtmlError('PARSE_ERROR'));
            return;
        }

        try {
            var rootTag = 'html';

            // 尝试修正 HTML
            content = fixHtml(content);

            var $ = cheerio.load(content, options);
            context.$ = $;
            context.$doc = $(rootTag);
            context.$root = $(rootTag);
            resolve();
        } catch(err) {
            reject(err);
        }
    });
}

// 解析选择器
// 支持：[]，@，/text()
// 输出：
//      如果是复杂选择器，则输出数组
//      如果是简单选择器，则输出字符串
function parseSelector(selector) {
    var atIndex = selector.indexOf('@'),
        attr,
        selectorArray;
    
    // 检查有没有要求提取 Attributes，
    // 有则先把 Attritube Name 提取出来
    if (atIndex > -1) {
        attr = selector.substring(atIndex + 1);
        selector = selector.substring(0, atIndex);
    }

    // 将 XPATH 的选择器替换为 CSS 选择器
    selector = selector.replace(/\[(\d+)\]/g, ':nth-child($1)');

    // 检查是否有 /
    if (selector.indexOf('/') > -1) {
        // 进行选择器切割
        selectorArray = selector.split('/');
        // 寻找是否还有下一层需要切分
        selectorArray = _.map(selectorArray, function (selector) {
            // 切分 xpath 的选择器
            if (selector.indexOf('/') > -1) {
                return selector.split('/');

            } else {
                return selector;
            }
        });
        // 扁平化数组
        selectorArray = _.flatten(selectorArray);
        // 是数字就转换为数字
        // 是字符串就过滤前后空格
        selectorArray = _.map(selectorArray, function (selector) {
            if (/^\d+$/.test(selector)) {
                return Number(selector);
            } else {
                return selector.trim();
            }
        });
        // 压缩字符串，替换 false 字符，避免空字符混入
        selectorArray = _.compact(selectorArray);
    }

    return {
        selector: selector,
        selectorArray: selectorArray,
        attr: attr
    };
}

// 在指定的元素内查找值
function extractValue($, $dom, selector, options) {
    try {
        var excludeHtmlTag = options && options.excludeHtmlTag,
            excludeHtmlAttr = options && options.excludeHtmlAttr,
            decodeEntities = options && options.decodeEntities,
            values = [],
            valueType = 'text',
            currentTextOnly = false,
            currentHtmlOnly = false;

        // 解析选择器
        selector = parseSelector(selector);

        if (selector.attr) {
            valueType = 'attr';
        }
        
        // 如果是复杂选择器数组，
        // 就来吧，分步骤选择出元素
        if (_.isArray(selector.selectorArray)) {
            _.find(selector.selectorArray, function (selector, i) {
                if (_.isString(selector)) {
                    // 检查是否是 xpath 选择器
                    if (selector.indexOf('()') > -1) {
                        // 取当前元素的内容
                        if (selector === 'text()') {
                            // 标记为只到达当前元素深度
                            currentTextOnly = true;
                            valueType = 'text';
                        // 取当前元素的 HTML
                        } else if (selector === 'html()') {
                            // 标记为只到达当前元素深度
                            currentHtmlOnly = true;
                            valueType = 'html';
                        }
                        return true;

                    // 一般的 CSS 选择器
                    } else {
                        $dom = $dom.find(selector);
                    }

                } else if (_.isNumber(selector)) {
                    $dom = $dom.eq(selector - 1);
                }
            });

        // 简单选择器，直接查找出元素
        } else {
            $dom = $dom.find(selector.selector);
        }

        // 遍历元素，找出需要的值
        $dom.each(function (index, item) {
            // 元素 HTML
            if (valueType === 'html') {
                // 由于 cheerio 处理后是 HTML Entity 的编码
                // 所以需要引入 html-entities 进行解码处理
                var $item = $(this),
                    html = $item.html(),
                    entities;
                // 看是否需要解码 HTML 实体
                if (decodeEntities) {
                    entities = new Entities();
                    html = entities.decode(html);
                }
                // 过滤掉需要排除掉的标签
                if (excludeHtmlTag
                    && excludeHtmlTag.length > 0) {
                    var tags = excludeHtmlTag.join('|'),
                        excludeTagRegExp = new RegExp('<(' + tags + ')[^>]*>.*<\/(' + tags + ')>', 'ig');;
                    html = html.replace(excludeTagRegExp, '');
                }
                // 过滤掉需要排除的属性
                if (excludeHtmlAttr
                    && excludeHtmlAttr.length > 0) {
                    var attrs = excludeHtmlAttr.join('|'),
                        excludeAttrRegExp = new RegExp('\\s?(' + attrs + ')\\s?=\\s?[\'"]?[^\'"]*[\'"]?', 'ig');
                    html = html.replace(excludeAttrRegExp, '');
                }
                // 存放 HTML
                values.push(html);

            // 元素内容
            } else if (valueType === 'text') {
                var maxDepth;
                if (currentTextOnly) {
                    maxDepth = 1;
                }
                var value = extractContent(item, maxDepth).trim(),
                    length = value.length;
                values.push(value);

            // 元素属性
            } else if (valueType === 'attr') {
                values.push(item.attribs[selector.attr]);
            }
        });
        
        return values;
    } catch(err) {
        throw err;
    }
}

// 提取元素的值
function extractValues($, $dom, fields, options) {
    var data = {};
    // fields 为
    // {
    //     key1: selector1,
    //     key2: selector2
    // }
    _.each(fields, function (selector, key) {
        if (!selector) {
            return;
        }

        try {
            var isArray = (key.lastIndexOf('[]') === key.length - 2),
                values = extractValue($, $dom, selector, options);

            // 如果结果不需要数组，则只取第一个
            if (!isArray) {
                values = values[0];
                // 如果结果值未定义，那就返回 null
                if (typeof values === 'undefined') {
                    values = null;
                }

            // 如果是数组，要把数组的标示去掉
            } else {
                key = key.replace('[]', '');
            }

            // 将数据存储到对应键上
            data[key] = values;
        } catch(err) {
            data[key] = null;
        }
    });
    return data;
}

// 提取元素的内容
function extractContent(item, maxDepth, depth) {
    var content = '',
        children = item && item.children;

    if (!item) {
        return content;
    }

    if (!depth) {
        depth = 0;
    }

    // 提取内容
    // 如果标签是块级元素，则在后面附带上换行符
    if (item.data) {
        content += item.data;
        if (item.type === 'tag' &&
            isBlockTag(item.name)) {
            content += '\n';
        }

    // 将 <br> 转为换行符
    } else if (item.type === 'tag' &&
        item.name === 'br') {
        content += '\n';
    }

    // 遍历下级
    _.each(children, function (child) {
        if (!child) {
            return;
        }
        // 排除 style / script 两种标签内容
        if (_.contains(['style', 'script'], child.type)) {
            return;
        }
        if (isNaN(maxDepth) || depth < maxDepth) {
            content += extractContent(child, maxDepth, depth + 1);
        }
    });

    return content;
}


// 打印日志到文件
// 支持不定参数，并且支持混合类型的不定参数
// (... message)
// 直接打印出日志，输出到 debug 文件
// (level, ... message)
// 指定日志级别，打印日志
// (... function(context, data))
// 直接执行函数并打印返回值到日志，输出到 debug 文件
// (level, ... function(context, data))
// 指定日志级别，执行函数并打印返回值到日志
function log(level) {
    var that = this,
        context = this.context,
        data = context && context.data,
        args = Array.prototype.slice.call(arguments);

    // 未指定日志等级，默认为 DEBUG
    if (_.isString(level) &&
        logLevels.indexOf(level.toLowerCase()) < 0) {
        level = DEBUG;

    // 指定了日志等级，去掉第一个参数
    } else {
        level = level.toLowerCase();
        args.shift();
    }

    if (args.length > 0) {
        var log = [];
        _.each(args, function (item) {
            // 类型是函数，执行并获取返回值
            if (_.isFunction(item)) {
                log.push(item.call(that, context, data));
            // 类型是非函数，直接插入数据
            } else {
                log.push(item);
            }
        });
        // 输出日志
        logger[level][level].apply(logger[level], log);
    } else {
        throw new RuntimeError('LOG_CONTENT_EMPTY');
    }
};

// Grab
function Grab() {
    var that = this;

    // 初始化配置
    this.options = _.extend({}, defaultOptions);

    // 初始化 context
    this.context = {
        // grab
        grab: that,
        // 页面源码
        content: null,
        // 数据
        data: {},
        // 根选择器
        $root: null,
        // 选择器
        $: null,
        // 分页序号
        nextIndex: 0,
        // 总时长：total Number
        // 请求页面时长：get Number
        // 设置数据市场：set Number
        // 解析时长：parse Number
        // 数据处理时长：data Number
        performance: {
            total: 0,
            get: 0,
            parse: 0,
            set: 0,
            data: 0
        },
        // 错误处理
        errorHandler: null
    };

    // 初始化执行队列
    this.queue = [];

    // 初始化计时
    // 起始：start
    // 请求页面开始：getStart Array(Number)
    // 请求页面结束：getEnd Array(Number)
    // 提交POST开始：postStart Array(Number)
    // 提交POST结束：postEnd Array(Number)
    // 解析开始：parseStart Array(Number)
    // 解析结束：parseEnd Array(Number)
    // 设置数据开始：setStart Array(Number)
    // 设置数据结束：setEnd Array(Number)
    // 数据处理开始：dataStart Array(Number)
    // 数据处理结束：dataEnd Array(Number)
    // 结束：end
    this.timing = {
        start: Date.now(),
        getStart: [],
        getEnd: [],
        postStart: [],
        postEnd: [],
        parseStart: [],
        parseEnd: [],
        setStart: [],
        setEnd: [],
        dataStart: [],
        dataEnd: [],
        end: 0
    };

    // 原始方法
    this.rawFn = {};

    // 包装所有方法，使之变成可以链式调用
    var prevPromise;
    _.each([
        'get',
        'post',
        'set',
        'echo',
        'config',
        'encoding',
        'follow',
        'doc',
        'find',
        'data',
        'json',
        'jsonp',
        'parse',
        'then',
        'page',
        'loop',
        'end',
        'done',
        'catch',
        'log'
    ], function (name) {
        var fn = this[name];

        // 保留下原始的方法
        this.rawFn[name] = fn;

        // 覆盖实例中的对应方法
        this[name] = function() {
            var args = Array.prototype.slice.call(arguments),
                task = {
                    name: name,
                    fn: fn,
                    args: args
                };

            that.queue.push(task);

            // 如果执行到 done，那么就开始执行队列
            if (name === 'done') {
                that.next();
            }

            return that;
        };
    }, this);

    return this;
}

// 附加上各种错误类型
Grab.HtmlError = HtmlError;
Grab.JsonError = JsonError;
Grab.NetworkError = NetworkError;
Grab.RuntimeError = RuntimeError;
// 附加上日志级别
Grab.Log = {
    DEBUG: DEBUG,
    INFO: INFO,
    WARN: WARN,
    ERROR: ERROR
};
// 附加上各等级的 logger
Grab.logger = {};
Grab.logger.debug = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(DEBUG);
    log.apply(log, args);
};
Grab.logger.info = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(INFO);
    log.apply(log, args);
};
Grab.logger.warn = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(WARN);
    log.apply(log, args);
};
Grab.logger.error = function () {
    var args = Array.prototype.slice.call(arguments);
    args.unshift(ERROR);
    log.apply(log, args);
};

Grab.prototype.config = function(arg) {
    var options = this.options;

    return new Promise(function (resolve, reject) {
        if (!arg) {
            reject(new RuntimeError('EMPTY_OPTIONS'));
            return;
        }
        if (_.isFunction(arg)) {
            arg(options);
        } else {
            _.extend(options, arg);
        }
        resolve();
    });
};

// 设置编码
Grab.prototype.encoding = function (enc) {
    var config = this.rawFn.config;
    return config({
            encoding: enc
        });
};

// 查找并定位到指定元素
// 一旦找到相应的元素，则当前的文档 DOM 将会定位到这个元素
// 以这个元素作为起点/基准元素
Grab.prototype.find = function (selector) {
    var context = this.context;

    return new Promise(function (resolve, reject) {
        if (!selector) {
            reject(new RuntimeError('EMPTY_SELECTOR'));
            return;
        }
        var $doc = context.$doc;
        context.$doc = $doc.find(selector);
        resolve();
    });
};

Grab.prototype.get = function (url, data, opts) {
    var timing = this.timing,
        context = this.context,
        data = this.data,
        options = this.options,
        requestOptions;

    // 更新请求方式
    options.method = 'GET';

    // 如果第一个参数是一个函数，则先执行该函数
    if (_.isFunction(url)) {
        url = url(context, data);
    }

    if (_.isString(url)) {
        requestOptions = {
            url: url,
            qs: data,
            options: opts
        };
    } else if (_.isObject(url)) {
        requestOptions = url;
    }

    // 扩展为完善的请求参数
    _.extend(requestOptions, options, requestOptions.options);

    return new Promise(function (resolve, reject) {
        // 抛出空链接的错误
        if (!requestOptions.url) {
            reject(new RuntimeError('EMPTY_URL'));
            return;
        }
        // 请求页面计时开始
        timing.getStart.push(Date.now());
        // 开始请求页面
        req(context, requestOptions, resolve, reject);
    }).then(function () {
        // 请求页面计时结束
        timing.getEnd.push(Date.now());
    });
};

Grab.prototype.post = function (url, data, opts) {
    var timing = this.timing,
        context = this.context,
        data = this.data,
        options = this.options,
        requestOptions;

    // 更新请求方式
    options.method = 'POST';

    // 如果第一个参数是一个函数，则先执行该函数
    if (_.isFunction(url)) {
        url = url(context, data);
    }

    if (_.isString(url)) {
        requestOptions = {
            url: url,
            formData: data,
            options: opts
        };
    } else if (_.isObject(url)) {
        requestOptions = url;
    }

    // 扩展为完善的请求参数
    _.extend(requestOptions, options, requestOptions.options);

    return new Promise(function (resolve, reject) {
        // 抛出空链接的错误
        if (!requestOptions.url) {
            reject(new RuntimeError('EMPTY_URL'));
            return;
        }
        // POST请求计时开始
        timing.postStart.push(Date.now());
        // 开始请求页面
        req(context, requestOptions, resolve, reject);
    }).then(function () {
        // POST请求计时结束
        timing.postEnd.push(Date.now());
    });
};

// ( selector , [limit] )
// Paginate the previous request limit times based on selector.

// selector:
// selector (String) - A selector string for either:

// an element with the next page URL in its inner text or in an attribute that commonly contains a URL (href, src, etc.)
// an element whose name and value attributes will respectively be added or replaced in the next page query.
// selector (Object) - An object where each key is a query parameter name and each value is either a selector string or an increment amount (+1, -1, etc.).

// limit:
// limit (Number) - Total number of "next page" requests to make.
// limit (String) - A selector string for an element containing the total number of requests to make.
Grab.prototype.page = function (selector, limit, handler) {
    var context = this.context,
        options = this.options,
        paging = {
            // 队列
            queue: null,
            // 处理方法
            handler: null,
            // 下一页
            next: {
                selector: null,
                limitSelector: null
            }
        };

    if (_.isArray(selector)) {
        paging.queue = selector;
    } else if (_.isString(selector)) {
        paging.next.selector = selector;
    } else if (_.isObject(selector)) {

    }

    if (_.isNumber(limit)) {
        paging.next.limit = limit;
    } else if (_.isString(limit)) {
        paging.next.limitSelector = limit;
    }

    if (_.isFunction(handler)) {
        paging.handler = handler;
    }

    return new Promise(function (resolve, reject) {
        var requestOptions = {};
        _.extend(requestOptions, options, {paging: paging});
        page(context, requestOptions, resolve, reject);
    });
};

// 循环开始标识
// (array, function)
// 
Grab.prototype.loop = function (array, handler) {
    var that = this,
        context = this.context,
        data = context.data,
        looping = {
            // 队列
            data: null,
            // 当前位置
            current: 0,
            // 总数
            total: 0
        };

    if (_.isString(array)) {
        array = data[array];
    }

    if (_.isArray(array)) {
        looping.data = array;
        looping.total = array.length;
    }

    return new Promise(function (resolve, reject) {
        // 更新循环配置
        context.looping = looping;
        // 调用处理函数
        if (_.isFunction(handler)) {
            handler.call(that, context, looping, resolve);
        } else {
            resolve();
        }
    });
}

// 循环结束
Grab.prototype.end = function () {
    var that = this,
        context = this.context,
        looping = context.looping;

    return new Promise(function (resolve, reject) {
        // 循环位置递增
        looping.current++;
        // 如果循环未结束，则继续重新回到循环开头
        if (looping.total
            && looping.current < looping.total) {
            context.queueIndex = context.loopStart;
        }
        resolve();
    });
}

// 将所提供的文本转化为指定对象
Grab.prototype.parse = function (content, options) {
    var timing = this.timing,
        context = this.context;

    return new Promise(function (resolve, reject) {
        if (!content) {
            reject(new HtmlError('EMPTY_CONTENT'));
            return;
        }
        // 解析计时开始
        timing.parseStart.push(Date.now());
        // 将页面内容放到上下文中
        context.content = content;
        // 解析页面
        parseHtml(context)
        .then(resolve)
        .catch(reject);
    }).then(function () {
        // 解析计时结束
        timing.parseEnd.push(Date.now());
    });
};

// 先查找 data 是否有对应键的值
// 如果找不到，则尝试查找元素是否有值
Grab.prototype.follow = function (key, callback) {
    var args = Array.prototype.slice.call(arguments),
        get = this.rawFn.get,
        options = this.options,
        context = this.context,
        $ = context.$,
        $doc = context.$doc,
        data = context.data,
        value = data[key],
        url;

    // 先从 data 中找
    if (!_.isUndefined(value)) {
        url = value;
    }

    // 找不到的话，从页面元素中提取
    if (!url) {
        url = extractValue($, $doc, key, options);
    }

    // 如果有回调处理方法，则执行回调处理方法
    if (callback) {
        url = callback(context, data, url);
    }

    // 如果是数组，则只取第一个
    if (_.isArray(url)) {
        url = url[0];
    }

    // 找不到执行的 URL，直接跳到下一步执行
    if (!url) {
        return Promise.resolve();
    }

    args.shift();
    args.unshift(url);
    
    return get.apply(this, args);
};

// 输出调试内容，方便查看
// 输出内容之前会先输出一行分割行以便识别
// ()
// 没有参数的情况下，输出获取到的完整内容
// (selector)
// 如果内容类型是 HTML，则会输出相应 CSS 选择器对应的 HTML 内容
// (key)
// 如果内容类型是 JSON，则会输出 JSON 对应 key 的数据
Grab.prototype.echo = function (selector) {
    var that = this,
        context = this.context,
        sign = '----echo' + (selector ? ':' + selector : '') + '----';

    return new Promise(function (resolve, reject) {
        if (selector) {
            if (context.contentType === 'html') {
                that.log(DEBUG, sign, context.$(selector).html(), sign);
                console.log(sign, context.$(selector).html(), sign);
            } else if (context.contentType === 'json') {
                that.log(DEBUG, context.data[selector], sign);
                console.log(DEBUG, context.data[selector], sign);
            }
        } else {
            that.log(DEBUG, context.content, sign);
            console.log(DEBUG, context.content, sign);
        }
    });
};

Grab.prototype.then = function (fn) {
    var that = this,
        context = this.context,
        data = context.data;

    return new Promise(function (resolve, reject) {
        if (!fn) {
            reject(new RuntimeError('THEN_FN_UNDEFINED'));
            return;
        }
        fn.call(that, context, data, resolve);
    });
};

Grab.prototype.set = function (key, selector) {
    var that = this,
        options = this.options,
        timing = this.timing,
        context = this.context,
        data = context.data,
        $ = context.$,
        $doc = context.$doc,
        fields = {};

    if (_.isString(key) &&
        _.isString(selector)) {
        fields[key] = selector;

    } else if (_.isObject(key)) {
        fields = key;
    }

    return new Promise(function (resolve, reject) {
        // 设置数据计时开始
        timing.setStart.push(Date.now());
        // 提取指定的值并且设置为数据
        _.extend(data, extractValues($, $doc, fields, options));
        resolve();
    }).then(function() {
        // 设置数据计时结束
        timing.setEnd.push(Date.now());
    });
};

// 回到文档顶部
// 用于
Grab.prototype.doc = function () {
    var that = this,
        context = this.context,
        $root = context && context.$root;

    return new Promise(function (resolve, reject) {
        if ($root) {
            // 回到页面顶部
            context.$doc = $root.clone();
            resolve();
        } else {
            reject(new RuntimeError('EMPTY_CONTEXT'));
        }
    });
};

// 进行数据处理
Grab.prototype.data = function (fn) {
    var that = this,
        timing = this.timing,
        context = this.context,
        data = context && context.data;

    return new Promise(function (resolve, reject) {
        if (!fn) {
            reject(new RuntimeError('DATA_FN_UNDEFINED'));
            return;
        }
        // 数据处理计时开始
        timing.dataStart.push(Date.now());
        if (data) {
            try {
                fn.call(that, data);
                resolve();
            } catch(err) {
                reject(err);
            }
        } else {
            reject(new RuntimeError('EMPTY_DATA'));
        }
    }).then(function () {
        // 数据处理计时结束
        timing.dataEnd.push(Date.now());
    });
};

// 进行 JSON 数据处理
Grab.prototype.json = function (fn) {
    var that = this,
        timing = this.timing,
        context = this.context,
        content = context && context.content;

    return new Promise(function (resolve, reject) {
        if (!fn) {
            reject(new RuntimeError('JSON_FN_UNDEFINED'));
            return;
        }
        // 数据处理计时开始
        timing.dataStart.push(Date.now());
        if (content) {
            try {
                // 解析 JSON
                var json = JSON.parse(content);
                fn.call(that, json);
                resolve();
            } catch(err) {
                reject(err);
            }
        } else {
            reject(new RuntimeError('EMPTY_JSON_DATA'));
        }
    }).then(function () {
        // 数据处理计时结束
        timing.dataEnd.push(Date.now());
    });
}

// 进行 JSONP 数据处理
Grab.prototype.jsonp = function (fn) {
    var that = this,
        timing = this.timing,
        context = this.context,
        content = context && context.content;

    return new Promise(function (resolve, reject) {
        if (!fn) {
            reject(new RuntimeError('JSONP_FN_UNDEFINED'));
            return;
        }
        // 数据处理计时开始
        timing.dataStart.push(Date.now());
        if (content) {
            try {
                // 处理 callback && callback(data); 
                // 将外层的回调方法去除
                content = content.replace(/[^\(]*\(/, '');
                content = content.replace(/\);?$/, '');
                // 解析 JSON
                var json = JSON.parse(content);
                fn.call(that, json);
                resolve();
            } catch(err) {
                reject(err);
            }
        } else {
            reject(new RuntimeError('EMPTY_JSON_DATA'));
        }
    }).then(function () {
        // 数据处理计时结束
        timing.dataEnd.push(Date.now());
    });
}

// 执行队列中的下一个任务
Grab.prototype.next = function () {
    var that = this,
        next = this.next,
        options = this.options,
        ignoreError = options.ignoreError,
        context = this.context,
        queueIndex = _.isNumber(context.queueIndex) ? ++context.queueIndex : (context.queueIndex = 0),
        queue = this.queue,
        queueLength = queue ? queue.length : 0,
        task = queue && queue[queueIndex],
        catchQueue = [],
        isQueueEnd = (queueIndex >= queueLength),
        errorHandler = context.errorHandler;

    // 如果是队列结束，则停止并且退出
    if (isQueueEnd) {
        return this;
    }

    // 如果 task 为空，则跳到下一步执行
    if (!task) {
        this.next();
        return this;
    }

    // 获取 task 信息
    var name = task.name,
        fn = task.fn,
        args = task.args,
        promise;

    // 有处理方法，执行处理方法
    if (fn) {
        // 获取页面，记录下这个节点序号
        if (_.contains(['get', 'post'], name)) {
            context.queueStart = queueIndex;
        }
        // 循环处理，记录下这个节点序号
        if (_.contains(['loop'], name)) {
            context.loopStart = queueIndex;
        }

        // 往后查找是否有 catch，如果有就要生成 catch 队列
        var catchTask;
        while (!_.isUndefined(catchTask = queue[++queueIndex])) {
            if (catchTask.name === 'catch') {
                catchQueue.push(catchTask);
                context.queueIndex = queueIndex;
            } else {
                break;
            }
        }

        // 开始执行 Promise
        promise = fn.apply(this, args).then(function () {
            that.next();
        });
        
        // 如果有异常捕获队列，则执行
        while (!_.isUndefined(catchTask = catchQueue.shift())) {
            var catchArgs = catchTask.args.slice(),
                catchFn = catchArgs.pop(),
                callbackFn = createCatchCallback(catchFn, context, next.bind(that));
            // 重新填充回回调方法
            catchArgs.push(callbackFn);
            // 应用异常捕获
            promise = promise.catch.apply(promise, catchArgs);
        }

        // 默认的异常捕获方法
        // 如果正常则执行下一步
        // 捕获错误就不再继续执行，报错
        promise
        .catch(function (err) {
            // 打印出错误信息
            that.log(ERROR, 'CATCH_PROMISE_EXCEPTION', err.message, err.stack);
            // 如果配置了错误处理方法，则执行错误处理方法
            if (errorHandler) {
                errorHandler.call(this, err);
            }
            // 如果配置了忽略错误，则继续执行
            if (ignoreError) {
                that.next();
            }
        });
    } else {
        this.next();
    }

    return this;
};

Grab.prototype.done = function (fn) {
    var that = this,
        timing = this.timing,
        context = this.context,
        performance = context.performance;

    // 计算各部分时间
    _.each(['get', 'post', 'parse', 'set', 'data'], function (key) {
        var start = timing[key + 'Start'],
            end = timing[key + 'End'],
            sum = 0;
        _.each(start, function (s, i) {
            var e = end[i];
            if (s && e) {
                sum += (e - s);
            }
        });
        performance[key] = sum;
    });
    
    // 计算总时间
    timing.end = Date.now();
    performance.total = timing.end - timing.start;

    return new Promise(function (resolve, reject) {
        try {
            if (fn) {
                fn.call(that, context);
            }
            resolve(context);
        } catch(err) {
            reject(err);
        }
    });
};

// 打印日志到文件
// 参数详见上方 log 函数注释
Grab.prototype.log = function (level) {
    var that = this,
        args = Array.prototype.slice.call(arguments);

    return new Promise(function (resolve, reject) {
        try {
            log.apply(that, args);
            resolve();
        } catch(err) {
            reject(err);
        }
    });
};

// 停止继续执行，直接退出
Grab.prototype.stop = function () {
    var context = this.context,
        queue = this.queue,
        queueLength = queue ? queue.length : 0;

    context.queueIndex = queueLength - 1;
    this.next();
};

// 直接跳转到最后的 done 执行，忽略剩余未执行的命令
Grab.prototype.finish = function () {
    var context = this.context,
        queue = this.queue,
        queueLength = queue ? queue.length : 0;

    context.queueIndex = queueLength - 2;
    this.next();
};

// 异常捕获处理
// (Class, fn(error, context, next))
// (fn(context, data, next))
Grab.prototype.catch = function (clazz, fn) {
    // 啥都不干
};

// 在配置了错误处理方法后，一旦异常没有被捕获，则会进入错误处理方法并且停止继续执行
Grab.prototype.error = function (fn) {
    var that = this,
        context = this.context;

    // 更新错误处理方法
    context.errorHandler = fn;

    return this;
};

module.exports = Grab;