(function() {
  var BoundProperty, Gunther, htmlElement, _fn, _i, _len, _ref;
  var __slice = Array.prototype.slice, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Gunther = {};
  Gunther.Template = (function() {
    Template.createHtmlElement = function(tagName) {
      return $("<" + tagName + " />");
    };
    Template.addAttributes = function(el, attributes) {
      var attribute, attributeName, attributeValue, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = attributes.length; _i < _len; _i++) {
        attribute = attributes[_i];
        _results.push((function() {
          var _results2;
          _results2 = [];
          for (attributeName in attribute) {
            attributeValue = attribute[attributeName];
            _results2.push(_.include(Gunther.HTML.eventNames, attributeName) ? el.bind(attributeName, function() {
              var args;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return attributeValue.apply(null, args);
            }) : attributeValue instanceof BoundProperty ? (el.attr(attributeName, attributeValue.getValue()), attributeValue.bind('change', function(newValue) {
              return el.attr(attributeName, newValue);
            })) : el.attr(attributeName, attributeValue));
          }
          return _results2;
        })());
      }
      return _results;
    };
    Template.generateChildren = function(el, childFn, scope) {
      var childResult;
      childResult = childFn.apply(scope);
      if (typeof childResult !== 'object') {
        el.append(childResult);
      }
      if (childResult instanceof BoundProperty) {
        el.html(childResult.getValue());
        return childResult.bind('change', function(newVal) {
          return el.html(newVal);
        });
      } else if (childResult instanceof Backbone.View) {
        childResult.el = el;
        return childResult.render();
      }
    };
    function Template(fn) {
      this.fn = fn;
      null;
    }
    Template.prototype.render = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      this.root = $('<div />');
      this.current = this.root;
      this.fn.apply(this, args);
      return this.root.children();
    };
    Template.prototype.renderInto = function() {
      var args, child, el, _i, _len, _ref, _results;
      el = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      _ref = this.render.apply(this, args);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(el.append(child));
      }
      return _results;
    };
    Template.prototype.createChild = function() {
      var args, current, el, tagName;
      tagName = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      current = this.current;
      el = Gunther.Template.createHtmlElement(tagName);
      this.current = el;
      if (typeof args[args.length - 1] === 'function') {
        Gunther.Template.generateChildren(el, args.pop(), this);
      }
      Gunther.Template.addAttributes(el, args);
      current.append(el);
      this.current = current;
      return null;
    };
    Template.prototype.bind = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return typeof result === "object" ? result : child;
      })(BoundProperty, args, function() {});
    };
    return Template;
  })();
  Gunther.HTML = (function() {
    function HTML() {}
    HTML.elements = ["a", "abbr", "address", "article", "aside", "audio", "b", "bdi", "bdo", "blockquote", "body", "button", "canvas", "caption", "cite", "code", "colgroup", "datalist", "dd", "del", "details", "dfn", "div", "dl", "dt", "em", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head", "header", "hgroup", "html", "i", "iframe", "ins", "kbd", "label", "legend", "li", "map", "mark", "menu", "meter", "nav", "noscript", "object", "ol", "optgroup", "option", "output", "p", "pre", "progress", "q", "rp", "rt", "ruby", "s", "samp", "script", "section", "select", "small", "span", "strong", "style", "sub", "summary", "sup", "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "time", "title", "tr", "u", "ul", "video", "area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr", "applet", "acronym", "bgsound", "dir", "frameset", "noframes", "isindex", "listing", "nextid", "noembed", "plaintext", "rb", "strike", "xmp", "big", "blink", "center", "font", "marquee", "multicol", "nobr", "spacer", "tt", "basefont", "frame"];
    HTML.eventNames = ['load', 'unload', 'blur', 'change', 'focus', 'reset', 'select', 'submit', 'abort', 'keydown', 'keyup', 'keypress', 'click', 'dblclick', 'mousedown', 'mouseout', 'mouseover', 'mouseup'];
    return HTML;
  })();
  _ref = Gunther.HTML.elements;
  _fn = function(htmlElement) {
    return Gunther.Template.prototype[htmlElement] = function() {
      var args;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      return this.createChild.apply(this, [htmlElement].concat(__slice.call(args)));
    };
  };
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    htmlElement = _ref[_i];
    _fn(htmlElement);
  }
  BoundProperty = (function() {
    function BoundProperty(model, propertyNames, valueGenerator) {
      var propertyName, _j, _len2, _ref2;
      this.model = model;
      this.propertyNames = propertyNames;
      this.valueGenerator = valueGenerator;
      if (!(this.valueGenerator != null) && typeof this.propertyNames === 'string') {
        this.valueGenerator = __bind(function() {
          return this.model.get(this.propertyNames[0]);
        }, this);
      }
      this.propertyNames = [].concat(this.propertyNames);
      _ref2 = this.propertyNames;
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        propertyName = _ref2[_j];
        this.model.bind("change:" + propertyName, __bind(function() {
          return this.trigger('change', this.getValue());
        }, this));
      }
    }
    BoundProperty.prototype.getValue = function() {
      var generatedValue;
      generatedValue = this.valueGenerator();
      if (generatedValue instanceof Gunther.Template) {
        return generatedValue.render();
      } else {
        return generatedValue;
      }
    };
    return BoundProperty;
  })();
  _.extend(BoundProperty.prototype, Backbone.Events);
  window.Gunther = Gunther;
}).call(this);