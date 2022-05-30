const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const htmlmin = require('gulp-htmlmin');
const squoosh = require('gulp-libsquoosh');
const del = require('del');
const svgmin = require('gulp-svgmin');
const svgstore = require('gulp-svgstore');
const rename = require('gulp-rename');
const gulp = require('gulp');


// Clean

const clean = () => {
  return del('build')
}

// Server

function browsersync() {
  browserSync.init({
    server: { baseDir: 'build/' },
    notify: false,
    online: true
  })
}

// Styles

function styles() {
  return src('source/sass/style.scss', { sourcemaps: true })
    .pipe(sass().on('error', sass.logError))
    .pipe(concat('style.min.css')) // Конкатенируем 
    .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // Создадим префиксы с помощью Autoprefixer
    .pipe(cleancss({ level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ })) // Минифицируем стили
    .pipe(dest('build/css', { sourcemaps: '.' }))
    .pipe(browserSync.stream()) // Сделаем инъекцию в браузер
}

// HTML

function html() {
  return src('source/*.html')
    .pipe(htmlmin({ collapseWhitespace: false }))
    .pipe(dest('build'))
}

// Scripts 

function scripts() {
  return src('source/js/*.js')
    .pipe(concat('app.min.js')) //Конкатенируем в один файл
    .pipe(uglify()) // Сжимаем JavaScript
    .pipe(dest('build/js/')) // Выгружаем готовый файл в папку назначения
    .pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}

// Images

async function optimazeImages() {
  return src('source/img/**/*.{png,jpg}')
    .pipe(squoosh())
    .pipe(dest('build/img'))
}

// Sprite

function sprite() {
  return src('source/img/sprite/*.svg')
    .pipe(svgmin())
    .pipe(svgstore({
      inLineSvg: true
    }))
    .pipe(rename('sprite.svg'))
    .pipe(dest('build/img'))
}
// Copy

function buildcopy() {
  return src([
    'source/fonts/*.{woff2,woff}',
    'source/favicon.ico',
  ], { base: 'source' })
    .pipe(dest('build'))
}

// Watcher 

// function startwatch() {
//   watch('source/js/*.js', scripts);
//   watch('source/sass/**/*.scss', styles);
//   watch('source/*.html').on('change', browserSync.reload);
//   watch('source/img/**/*.{png,jpg}', optimazeImages);
// }
function startwatch() {
  gulp.watch('source/sass/**/*.scss', gulp.series(styles));
  gulp.watch('source/js/app.js', gulp.series(scripts))
    .on('change', browserSync.reload);
  gulp.watch('source/*.html', gulp.series(html))
    .on('change', browserSync.reload);
  gulp.watch('source/img/**/*.{png,jpg}', gulp.series(optimazeImages))
    .on('change', browserSync.reload);
}

exports.clean = clean;
exports.browsersync = browsersync;
exports.styles = styles;
exports.html = html;
exports.scripts = scripts;
exports.optimazeImages = optimazeImages;
exports.sprite = sprite;
exports.buildcopy = buildcopy;
exports.default = series(clean, buildcopy, parallel(styles, html, scripts, optimazeImages, sprite, browsersync, startwatch));
