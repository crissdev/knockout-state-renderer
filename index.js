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
      ko.virtualElements.emptyNode(domApi.parentElement);
      cb(null);
    }

    function getChildElement(domApi, cb) {
      var element = domApi.parentElement.querySelector(options.childElementSelector);
      cb(null, element);
    }

    function render(context, cb) {
      var parentElement = context.element;
      var templateNodes = ko.utils.parseHtmlFragment(context.template);

      if (typeof parentElement === 'string') {
        parentElement = document.querySelector(parentElement);
      }

      _applyBindings(parentElement, context.content || {}, templateNodes);

      cb(null, {
        parentElement: parentElement,
        templateNodes: templateNodes
      });
    }

    function reset(context, cb) {
      ko.virtualElements.emptyNode(context.domApi.parentElement);
      _applyBindings(context.domApi.parentElement, context.content || {}, context.domApi.templateNodes);

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
  };
};
