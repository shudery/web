var gulp = require('gulp');
//插件自动加载工具，在需要用到对应插件时就会自动从package.json的依赖中下载
var plugins = require('gulp-load-plugins')(); //立即执行

/*********************************************/
//启动server
gulp.task('connect',function(){
	plugins.connect.server({
		root:'src',
		livereload: true
	})
})
//设置重载的html文件
gulp.task('reloadFile',function(){
	gulp.src('src/html/*.html')
	.pipe(plugins.connect.reload());
});
//设置监听，更新时重载,**监听src下所有文件的变化
gulp.task('watchFile',function(){
	gulp.watch(['src/**'],['reloadFile'])
})
//开启监听重载
gulp.task('watch',['connect','watchFile'])
/*********************************************/

//创建minify压缩任务
gulp.task('minify', ['minify-js', 'minify-html', 'minify-css'], function() {
	console.log('All files have already minify!')
})

gulp.task('minify-js', function() {
	gulp.src('src/js/**',{base:'src'}) //打开目录下的相应文件
		//.pipe(plugins.concat('all.js'))  //合并js文件
		.pipe(plugins.uglify()) //压缩
		//.pipe(plugins.rename('app.min.js'))  //多个文件的时候就不要rename了
		.pipe(gulp.dest('build')) //写入build目录
});

gulp.task('minify-html', function() {
	gulp.src('src/html/**',{base:'src'})
		.pipe(plugins.minifyHtml())
		//.pipe(plu gins.rename('index.min.html'))
		.pipe(gulp.dest('build'))
})

gulp.task('minify-css', function() {
	gulp.src('src/css/**',{base:'src'})
		//.pipe(plugins.concat('all.css'))  //合并css文件
		.pipe(plugins.minifyCss())
		//.pipe(plugins.rename('style.min.css'))
		.pipe(gulp.dest('build'))
})
/*********************************************/

//gulp.task('htmljs-uglify',['useref',''])

// gulp.task('useref', function() {
// 	gulp.src('html/*.html')
// 		.pipe(plugins.useref())
// 		.pipe(plugins.rename('html-allJs.js'))
// 		.pipe(gulp.dest('build'))
// })