# fis3-parser-atom

atom fis3 编译插件

## Setup

全局安装

```sh
npm install -g fis3-parser-atom
```

本地安装

```sh
npm install -D fis3-parser-atom
```

## Usage

在你的 `fis-conf.js` 中添加以下配置：

```js
fis.match('(**)/(*).atom', {
    isMod: true,
    // fis3 不支持多重后缀，即不支持 .atom.js，只能写 js；
    rExt: 'js',
    // 由于上边不支持多重后缀，所以我们这里 release 的时候加上后缀
    release: '$1/$2.atom.js',
    useSameNameRequire: true,
    // 这里极为关键，不加 isJsLike 就不把我们当 js 处理了；
    isJsLike: true,
    // 输出为 commonjs 模块，这里可以按需要来指定 mode，支持 commonjs / amd / umd / global；
    parser: fis.plugin('atom', {
        mode: 'commonjs',
        // 自己定制编译 javascript 代码
        compileJsScript(code) {
            return require('babel-core').transform(
                code,
                {
                    plugins: [
                        'replace-object-assign'
                    ],
                    presets: [
                        ['babel-preset-env', {
                            include: ['transform-es2015-modules-commonjs']
                        }]
                    ]
                }
            ).code;
        }
    })
});
```
