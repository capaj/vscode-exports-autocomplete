# vscode-exports-autocomplete

[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/capaj.vscode-exports-autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=capaj.vscode-exports-autocomplete) [![Installs](http://vsmarketplacebadge.apphb.com/installs/capaj.vscode-exports-autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=capaj.vscode-exports-autocomplete) [![Rating](http://vsmarketplacebadge.apphb.com/rating/capaj.vscode-exports-autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=capaj.vscode-exports-autocomplete) [![Build Status](https://travis-ci.org/capaj/vscode-exports-autocomplete.svg?branch=master)](https://travis-ci.org/capaj/vscode-exports-autocomplete)

## Showcase

![showcase](images/showcase.gif)

## Features
Collects ES6 exports from your project and autocompletes them. Upon completion, item is also imported using a relative path. Import is placed after last import in that file.

Generated import has no semicolon when you have a `standard` package in your `package.json` devDependencies. If you have eslint, it should pick up it's semicolon config and insert/omit semicolon accordingly to what you have set.

Of course it works even with huge projects which contain thousands of JS files. All JS/JSX files are parsed and cached on startup, then vscode internal file watcher is used to observe changed files.

We also parse ES6 files in node_modules-just the roots. For example if you have redux package in your `dependencies`, we will parse [this file](https://github.com/reactjs/redux/blob/master/src/index.js) giving us exactly the exports we want. So if you're a lib author, don't forget to add `module` property to your package.json.

## Extension Settings

This extension will have the following settings:

* `vscode-exports-autocomplete.enable`: enable/disable this extension
* `vscode-exports-autocomplete.cacheSizeLimit`: size limit for the cache of parsed exports, parsed with bytes npm package, shared among all projects, default "25MB"
