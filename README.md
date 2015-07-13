# knockout-state-renderer

[![npm version](https://badge.fury.io/js/knockout-state-renderer.svg)](http://badge.fury.io/js/knockout-state-renderer)


Use [Knockout](http://github.com/knockout/knockout/) with [abstract-state-router](https://github.com/TehShrike/abstract-state-router)!


## Usage

```js

var StateRouter = require('abstract-state-router')
var knockoutRenderer = require('knockout-state-renderer')()
var domready = require('domready')

var stateRouter = StateRouter(knockoutRenderer, 'body')

// add whatever states to the state router

domready(function() {
    stateRouter.evaluateCurrentRoute('login')
})
```
