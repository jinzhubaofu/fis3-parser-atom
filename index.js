/**
 * @file atom parser plugin for fis3
 *       参考自 https://github.com/ccqgithub/fis3-parser-vue-component/blob/master/index.js
 * @author leon <ludafa@outlook.com>
 */

/* eslint-disable fecs-no-require */

const atom = require('@baidu/atom-web-compiler');
const less = require('less');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');

const DEFAULT_OPTIONS = {
    mode: 'amd',
    strip: false
};

function addDeriveFile(file, type, content, required = false) {
    let derivedFile = fis.file.wrap(`${file.realpath}.${type}`);
    derivedFile.setContent(content);

    // 参考自https://github.com/ccqgithub/fis3-parser-vue-component/blob/master/index.js#L133
    if (type === 'css') {
        derivedFile.isCssLike = true;
        derivedFile.cache = file.cache;
        fis.compile.process(derivedFile); // 走一遍css构建
        derivedFile.links.forEach(function (derived) {
            file.addLink(derived);
        });
    }

    file.derived.push(derivedFile);
    if (required) {
        file.addRequire(derivedFile.getId());
    }
    return derivedFile;
}

module.exports = function (content, file, options = DEFAULT_OPTIONS) {
    // 在atom文件先执行一次js编译，目的是将 __uri 等资源定位先做了，否则atom无法编译文件
    content = fis.compile.partial(content, file, {
        ext: 'js',
        isJsLike: true
    });
    // 处理template标签里诸如： <img src="../img/apply-for-toast.png" alt="apply-job">
    content = fis.compile.partial(content, file, {
        ext: 'html',
        isHtmlLike: true
    });
    file.setContent(content);

    if (Buffer.isBuffer(content)) {
        content = content.toString('utf-8');
    }

    options = Object.assign(
        {},
        DEFAULT_OPTIONS,
        {
            content: content,
            compilePHPComponent(relativePath) {
                return ''
                    + 'dirname(__FILE__) . "/" '
                    + '. ' + JSON.stringify(relativePath + '.php');
            },
            compileStyle(code, options) {

                if (options.lang === 'less') {
                    less.render(code, {
                        relativeUrls: true,
                        syncImport: true
                    }, function (error, result) {
                        if (error) {
                            console.error(error.message, error.stack); // eslint-disable-line no-console
                            return;
                        }
                        code = result.css;
                    });
                }

                // 编译css片段，支持资源定位
                code = fis.compile.partial(code, file, {
                    ext: 'css',
                    isCssLike: true
                });

                return postcss([
                    autoprefixer({
                        browsers: [
                            'android >= 2.3',
                            'ios >= 7'
                        ],
                        remove: false
                    })
                ]).process(code).css;
            }
        },
        options
    );

    let result = atom.compile(options);

    let {js, php, css} = result.compiled;

    // 把fis编译过程新增的文件加入fis处理流中, 可以match上
    addDeriveFile(file, 'php', php);
    addDeriveFile(file, 'css', css, true);

    // .atom会被当成js处理
    return js;
};
