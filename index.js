'use strict';
var ko = require('knockout');


module.exports = function KnockoutStateRenderer(options) {
  options = ko.utils.extend({dataItemAlias: '$page', childElementSelector: 'ui-view'}, options);

  return function makeRenderer(stateRouter) {
    var stateChangeEndDependency = ko.observable();
    stateRouter.on('stateChangeEnd', stateChangeEndDependency.valueHasMutated);

    return {
      destroy: destroy,
      getChildElement: getChildElement,
      render: render,
      reset: reset
    };

    function destroy(domApi, cb) {
      if (typeof domApi.viewModel.dispose === 'function') {
        domApi.viewModel.dispose();
      }
      ko.virtualElements.emptyNode(domApi.parentElement);
      cb(null);
    }

    function getChildElement(domApi, cb) {
      var element = domApi.parentElement.querySelector(options.childElementSelector);
      cb(null, element);
    }

    function render(context, cb) {
      var parentElement = context.element;
      var templateNodes = _resolveTemplate((context.template && context.template.template) || context.template);

      if (typeof parentElement === 'string') {
        parentElement = document.querySelector(parentElement);
      }

      var createViewModel = _resolveViewModel((context.template && context.template.viewModel) || function() {});
      var viewModel = createViewModel();

      _applyBindings(parentElement, viewModel, templateNodes);

      cb(null, {
        viewModel: viewModel,
        parentElement: parentElement,

        _createViewModel: createViewModel,
        _templateNodes: templateNodes
      });
    }

    function reset(context, cb) {
      if (typeof context.domApi.viewModel.resetContext === 'function') {
        context.domApi.viewModel.resetContext(context.content);
      }
      cb(null);
    }

    function _applyBindings(parentElement, viewModel, templateNodes) {
      var parentContext = ko.contextFor(parentElement);
      var bindingContext = parentContext
        ? parentContext.createChildContext(viewModel, options.dataItemAlias)
        : new ko.bindingContext(viewModel, null, options.dataItemAlias);

      viewModel.stateIsActive = stateIsActive;
      viewModel.makePath = stateRouter.makePath.bind(stateRouter);

      ko.virtualElements.setDomNodeChildren(parentElement, ko.utils.cloneNodes(templateNodes));
      ko.applyBindingsToDescendants(bindingContext, parentElement);
    }

    function stateIsActive(stateName, opts) {
      stateChangeEndDependency();
      return stateRouter.stateIsActive(stateName, opts);
    }


    function _makeArray(arrayLikeObject) {
      var result = [];
      for (var i = 0, j = arrayLikeObject.length; i < j; i++) {
        result.push(arrayLikeObject[i]);
      }
      return result;
    }

    function _resolveTemplate(templateConfig) {
      if (typeof templateConfig === 'string') {
        // Markup - parse it
        return ko.utils.parseHtmlFragment(templateConfig);
      } else if (templateConfig instanceof Array) {
        // Assume already an array of DOM nodes - pass through unchanged
        return templateConfig;
      } else if (_isDocumentFragment(templateConfig)) {
        // Document fragment - use its child nodes
        return _makeArray(templateConfig.childNodes);
      } else if (templateConfig['element']) {
        var element = templateConfig['element'];
        if (_isDomElement(element)) {
          // Element instance - copy its child nodes
          return _cloneNodesFromTemplateSourceElement(element);
        } else if (typeof element === 'string') {
          // Element ID - find it, then copy its child nodes
          var elemInstance = document.getElementById(element);
          if (elemInstance) {
            return _cloneNodesFromTemplateSourceElement(elemInstance);
          } else {
            throw new Error('Cannot find element with ID ' + element);
          }
        } else {
          throw new Error('Unknown element type: ' + element);
        }
      } else {
        throw new Error('Unknown template value: ' + templateConfig);
      }
    }

    function _resolveViewModel(viewModelConfig) {
      if (typeof viewModelConfig === 'function') {
        // Constructor - convert to standard factory function format
        // By design, this does *not* supply componentInfo to the constructor, as the intent is that
        // componentInfo contains non-viewmodel data (e.g., the component's element) that should only
        // be used in factory functions, not viewmodel constructors.
        return (function () { return new viewModelConfig(); });
      } else if (typeof viewModelConfig['createViewModel'] === 'function') {
        // Already a factory function - use it as-is
        return viewModelConfig['createViewModel'];
      } else if ('instance' in viewModelConfig) {
        // Fixed object instance - promote to createViewModel format for API consistency
        var fixedInstance = viewModelConfig['instance'];
        return (function () {
          return fixedInstance;
        });
      } else {
        throw new Error('Unknown viewModel value: ' + viewModelConfig);
      }
    }

    function _cloneNodesFromTemplateSourceElement(elemInstance) {
      switch (_tagNameLower(elemInstance)) {
        case 'script':
          return ko.utils.parseHtmlFragment(elemInstance.text);
        case 'textarea':
          return ko.utils.parseHtmlFragment(elemInstance.value);
        case 'template':
          // For browsers with proper <template> element support (i.e., where the .content property
          // gives a document fragment), use that document fragment.
          if (_isDocumentFragment(elemInstance.content)) {
            return ko.utils.cloneNodes(elemInstance.content.childNodes);
          }
      }

      // Regular elements such as <div>, and <template> elements on old browsers that don't really
      // understand <template> and just treat it as a regular container
      return ko.utils.cloneNodes(elemInstance.childNodes);
    }

    function _isDomElement(obj) {
      if (window['HTMLElement']) {
        return obj instanceof HTMLElement;
      } else {
        return obj && obj.tagName && obj.nodeType === 1;
      }
    }

    function _isDocumentFragment(obj) {
      if (window['DocumentFragment']) {
        return obj instanceof DocumentFragment;
      } else {
        return obj && obj.nodeType === 11;
      }
    }

    function _tagNameLower(element) {
      // For HTML elements, tagName will always be upper case; for XHTML elements, it'll be lower case.
      // Possible future optimization: If we know it's an element from an XHTML document (not HTML),
      // we don't need to do the .toLowerCase() as it will always be lower case anyway.
      return element && element.tagName && element.tagName.toLowerCase();
    }
  };
};
