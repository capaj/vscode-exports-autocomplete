# vscode-component-autocomplete README

[![Marketplace Version](http://vsmarketplacebadge.apphb.com/version/capaj.vscode-component-autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=capaj.vscode-component-autocomplete) [![Installs](http://vsmarketplacebadge.apphb.com/installs/capaj.vscode-component-autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=capaj.vscode-component-autocomplete) [![Rating](http://vsmarketplacebadge.apphb.com/rating/capaj.vscode-component-autocomplete.svg)](https://marketplace.visualstudio.com/items?itemName=capaj.vscode-component-autocomplete)

## Showcase

![showcase](images/showcase.gif)

Of course it works even with huge projects which contain thousands of JS files.

## Features
Collects ES6 exports from your whole project and autocompletes them. Upon completion, item is also imported using a relative path. Import is placed after last import in that file. Import ends with a semicolon unless you have a `standard` package in your `package.json` devDependencies.

## Extension Settings

This extension will have the following settings(WIP-not implemented yet):

* `componentsAutocomplete.enable`: enable/disable this extension
* `componentsAutocomplete.glob`: array of glob expressions. Only matching files are watched.
