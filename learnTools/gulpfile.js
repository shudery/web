var gulp = require('gulp');
var plugins = require('gulp-load-plugins')(); //立即执行
//插件自动加载工具，在需要用到对应插件时就会自动从package.json的依赖中下载

gulp.task('html',function(){
	gulp.src('html/index.html')
	.pipe(gulp.dest('test'))
	.pipe(plugins.livereload());
})

gulp.task('watch',function(){
	plugins.livereload.listen();
	gulp.watch('html/index.html',['html'])
})

//创建minify压缩任务
gulp.task('minify', ['minify-js', 'minify-html', 'minify-css'], function() {
	console.log('All files have already minify!')
})

gulp.task('minify-js', function() {
	gulp.src('js/*.js') //打开目录下的相应文件
		//.pipe(plugins.concat('all.js'))  //合并js文件
		.pipe(plugins.uglify()) //压缩
		//.pipe(plugins.rename('app.min.js'))  //多个文件的时候就不要rename了
		.pipe(gulp.dest('build')) //写入build目录
});

gulp.task('minify-html', function() {
	gulp.src('html/*.html')
		.pipe(plugins.minifyHtml())
		//.pipe(plu gins.rename('index.min.html'))
		.pipe(gulp.dest('build'))
})

gulp.task('minify-css', function() {
	gulp.src('css/*.css')
		//.pipe(plugins.concat('all.css'))  //合并css文件
		.pipe(plugins.minifyCss())
		//.pipe(plugins.rename('style.min.css'))
		.pipe(gulp.dest('build'))
})

//gulp.task('htmljs-uglify',['useref',''])

// gulp.task('useref', function() {
// 	gulp.src('html/*.html')
// 		.pipe(plugins.useref())
// 		.pipe(plugins.rename('html-allJs.js'))
// 		.pipe(gulp.dest('build'))
// })