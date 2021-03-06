/**
 * Created by yaozhiguo on 2016/11/4.
 */
var fs    = require('fs');
var path  = require('path');
var gulp = require('gulp');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

var gutil = require('gulp-util');
var browserify = require('browserify');
var watchify = require('watchify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var tsify = require("tsify");
var browserify_shim = require('browserify-shim');
var assign = require('lodash.assign');

var dest = 'dist';
var src = 'src';

// 在这里添加自定义 browserify 选项
var customOpts = {
    entries: [src + '/index.js'],
    extensions: ['.js', '.ts'],
    debug: true,
    // standalone: 'Main'
};


var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts).plugin("tsify", {
    noImplicitAny: false,
    target: "es5"
}));
b.transform(browserify_shim, {
    global: true
});

// 在这里加入变换操作
// 比如： b.transform(coffeeify);

gulp.task('scripts', bundle); // 可以运行 `gulp scripts` 来编译文件了
b.on('update', bundle); // 当任何依赖发生改变的时候，运行打包工具
b.on('log', gutil.log); // 输出编译日志到终端

function bundle() {
    return b.bundle()
    // 如果有错误发生，记录这些错误
        .on('error', gutil.log.bind(gutil, 'Browserify Error'))
        .pipe(source('mygl.js'))
        // 可选项，如果你不需要缓存文件内容，就删除
        .pipe(buffer())
        // 可选项，如果你不需要 sourcemaps，就删除
        .pipe(sourcemaps.init({
            loadMaps: true
        })) // 从 browserify 文件载入 map
        // 在这里将变换操作加入管道
        .pipe(sourcemaps.write('./')) // 写入 .map 文件
        .pipe(gulp.dest(dest));
}

gulp.task('css', function(){
    return gulp.src('css/**/*')
        .pipe(gulp.dest(dest + '/css'));
});

gulp.task('libs', function(){
    gulp.src('ace-lib/**/*')
        .pipe(gulp.dest(dest + '/ace-lib'));
    gulp.src('aether-lib/**/*')
        .pipe(gulp.dest(dest + '/aether-lib'));
    gulp.src('aether-plugin/**/*')
        .pipe(gulp.dest(dest + '/aether-plugin'));

    return gulp.src('libs/**/*.js')
        .pipe(gulp.dest(dest + '/libs'));
});

gulp.task('html', function(){
    return gulp.src('*.html')
        .pipe(gulp.dest(dest))
});

gulp.task('dist', ['html', 'css', 'libs', 'scripts']);

gulp.task('webserver', function () {
    connect.server({
        name: 'server',
        root: '',
        port: 3008
    });
});

function getFolders( dir ) {
    return fs.readdirSync( dir )
        .filter( function( file ) {
            return fs.statSync( path.join(dir, file) ).isDirectory();
        });
}

gulp.task('js-compress', function() {
    var folders = getFolders('lib/ace/');

    var tasks = folders.map( function(folder) {
        return gulp.src(path.join('lib/ace/', folder, '/*.js'))
            .pipe(uglify())
            .pipe(gulp.dest(path.join('lib/ace/', folder)));
        // .pipe(rename(folder + '.min.js'))
        // .pipe(gulp.dest(path.join(srcPath, folder)));
    });
    // return tasks;

    gulp.src(path.join('lib/ace/', '/*.js')).pipe(uglify())
        .pipe(gulp.dest('lib/ace/'));
});

gulp.task('main-compress', function(){
    gulp.src('dist/mygl.js').pipe(uglify({
        mangle:false
    })).pipe(gulp.dest('dist/min'))
});

gulp.task('default', ['scripts', 'webserver']);
//gulp.task('default', ['main-compress']);