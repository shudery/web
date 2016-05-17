var gulp = require('gulp');
var uglify = require('gulp-uglify');
//创建minify压缩任务
gulp.task('minify', function() {
	console.log('mytask');
	gulp.src('js/app.js')//打开当前目录下的相应文件
		.pipe(uglify())//压缩
		.pipe(gulp.dest('build'))//写入build目录
});