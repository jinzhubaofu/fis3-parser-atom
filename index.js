/**
 * @file atom parser plugin for fis3
 * @author leon <ludafa@outlook.com>
 */

/* eslint-disable fecs-no-require */

const atom = require('vip-server-renderer');

const DEFAULT_OPTIONS = {
    mode: 'amd',
    strip: false
};

function addDeriveFile(file, type, content, required = false) {

    let derivedFile = fis.file.wrap(`${file.realpath}.${type}`);

    derivedFile.setContent(content);

    file.derived.push(derivedFile);

    if (required) {
        file.addRequire(derivedFile.getId());
    }

}

module.exports = function (content, file, options = {}) {

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
            }
        },
        options
    );

    let result = atom.compile(options);

    let {js, php, css} = result.compiled;

    addDeriveFile(file, 'php', php);
    addDeriveFile(file, 'css', css, true);

    return js;

};
