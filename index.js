/**
 * @file atom parser plugin for fis3
 * @author leon <ludafa@outlook.com>
 */

/* eslint-disable fecs-no-require */

const atom = require('vip-server-renderer');

const DEFAULT_OPTIONS = {
    mode: 'amd'
};

function addCssDeriveFile(file, type, content, required = false) {

    let derivedFile = fis.file.wrap(`${file.realpath}.${type}`);

    derivedFile.setContent(content);

    file.derived.push(derivedFile);

    if (required) {
        file.addRequire(derivedFile.getId());
    }
    return derivedFile;
}

function addDeriveFile(file, type, content, required = false) {
    // css也采用片段编译，更好的支持less、sass等其他语言
    content = fis.compile.partial(content, file, {
        ext: 'css',
        isCssLike: true
    });

    let derivedFile = fis.file.wrap(`${file.realpath}.${type}`);
    derivedFile.setContent(content);
    derivedFile.isCssLike = true;
    derivedFile.cache = file.cache;
    fis.compile.process(derivedFile); // 走一遍css构建
    derivedFile.links.forEach(function (derived) {
        file.addLink(derived);
    });

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
    // 处理诸如： <img src="../img/apply-for-toast.png" alt="apply-job">
    content = fis.compile.partial(content, file, {
        ext: 'html',
        isHtmlLike: true
    });
    file.setContent(content);

    // 继续走之后的 js parser 流程。

    if (Buffer.isBuffer(content)) {
        content = content.toString('utf-8');
    }
    // console.log('content', file.fullname, content);
    let result = atom.compile({
        content: content,
        strip: false,
        mode: options.mode,
        compilePHPComponent(relativePath) {
            return ''
                + 'dirname(__FILE__) . "/" '
                + '. ' + JSON.stringify(relativePath + '.php');
        },
        compileStyle(code, options) {
            if (options.lang === 'less') {
                const LessPluginAutoPrefix = require('less-plugin-autoprefix');
                require('less').render(code, {
                    relativeUrls: true,
                    syncImport: true,
                    plugins: [
                        new LessPluginAutoPrefix({
                            browsers: [
                                'android >= 2.3',
                                'ios >= 7'
                            ]
                        })
                    ]
                }, function (error, result) {
                    if (error) {
                        console.error(error.message, error.stack);
                        return;
                    }
                    code = result.css;
                });
            }
            // css也采用片段编译，更好的支持less、sass等其他语言
            code = fis.compile.partial(code, file, {
                ext: 'css',
                isCssLike: true
            });

            return code;
        }
    });

    let {js, php, css} = result.compiled;

    js = fis.compile.partial(js, file, {
        ext: 'js',
        isJsLike: true
    });

    addDeriveFile(file, 'php', php);
    addCssDeriveFile(file, 'css', css, true);

    return js;

};
