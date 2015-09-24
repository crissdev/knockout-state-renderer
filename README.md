# knockout-state-renderer

[![npm version](https://badge.fury.io/js/knockout-state-renderer.svg)](http://badge.fury.io/js/knockout-state-renderer)


Use [Knockout](http://github.com/knockout/knockout/) with [abstract-state-router](https://github.com/TehShrike/abstract-state-router)!


## Examples 

- **Hackers News** http://crissdev.github.io/hn-ko-asr/

## Usage

```js

var StateRouter = require('abstract-state-router')
var knockoutRenderer = require('knockout-state-renderer')
var domready = require('domready')

var stateRouter = StateRouter(knockoutRenderer(/* options */), 'body')

// add whatever states to the state router

domready(function() {
    stateRouter.evaluateCurrentRoute('login')
})
```

See [state-router-example](https://github.com/crissdev/state-router-example) for an implementation using
this renderer.


## API

The renderer implementation accepts some options to control data binding inside the templates.


#### dataItemAlias

An alias used when the binding context is created, accessible inside the templates. The default value 
is `$page`.

#### childElementSelector

The CSS selector used to find the element where the child state should be rendered. The default value
is `ui-view`.
