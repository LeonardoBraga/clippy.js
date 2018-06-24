const gulp = require('gulp');
const uglify = require('gulp-uglifyes');
const babel = require('gulp-babel');
const del = require('del');
const concat = require('gulp-concat');
const csso = require('gulp-csso');

const paths = {
    styles: {
        src: 'src/clippy.css',
        dest: 'build/'
    },

    scripts: {
        src: 'src/**/*.js',
        dest: 'build/'
    }
};

function clean() {
    return del(['build']);
}

function styles() {
    return gulp.src(paths.styles.src)
        .pipe(csso())
        .pipe(gulp.dest(paths.styles.dest));
}

function scripts() {
    return gulp.src(paths.scripts.src)
        .pipe(concat('clippy.min.js'))
        .pipe(babel())
        .pipe(uglify())
        .pipe(gulp.dest(paths.scripts.dest));
}

const build = gulp.series(clean, gulp.parallel(scripts, styles));

gulp.task('build', build);

gulp.task('default', build);