function Model(opts) {
  var id_count = 0;

  function M(attrs) {
    id_count++;

    var self = this;
    self.attributes = attrs || {};
    self.id = id_count;
    self.attributes.id = id_count;

    if (opts && opts.change && _.isFunction(opts.change)) {
      self.__events.push(opts.change);
    }
  }

  M.prototype = {
    __events: [],
    __remove: function() { console.log("model"); },
    set: function(key, val) {
      this.attributes[key] = val;
      this.triggerChange();
    },
    get: function(key) {
      return this.attributes[key];
    },
    remove: function(key) {
      delete this.attributes[key];
      this.triggerChange();
    },
    triggerChange: function() {
      this.__events.forEach(function(cb) {
        cb();
      });
    },
    addCallback: function(cb) {
      this.__events.push(cb);
    }
  };

  _.extend(M.prototype, opts);

  return M;
}

function Collection(opts) {
  function C(model_constructor) {
    this.models = [];
    this.model = model_constructor;
  }

  function arrayOfModels(models) {
    return _.isArray(models) ? models : [models];
  }

  function updateModel(m) {
    var existing_m = _(this.models).findWhere({ id: m.id });

    if (existing_m) {
      for (var key in m.attributes) {
        if (m.attributes[key] !== existing_m.attributes[key]) {
          existing_m.set(key, m.attributes[key]);
        }
      }
    }
    else {
      addModel.call(this, m);
    }
  }

  C.prototype = {
    add: function(model) {
      var old_m = _(this.models).findWhere({ id: model.id }),
          new_m;

      if (old_m) { return old_m; }

      new_m = new this.model(model);
      this.models.push(new_m);

      return new_m;
    },
    remove: function(model) {
      model = _.isNumber(model) ? { id: model } : model;

      var m = _(this.models).findWhere(model);

      if (!m) { return; }

      m.__remove();
      this.models = this.models.filter(function(existing_m) {
        return existing_m.attributes.id !== m.id;
      });
    },
    set: function(models) {
      var self = this;
      models = arrayOfModels(models);

      models.forEach(updateModel.bind(self));
      self.models.forEach(function(m) {
        console.log(m.attributes.id);
        if (!_(models).where({ id: m.attributes.id }).length) {
          self.remove(m);
        }
      });
    },
    get: function(idx) {
      return _(this.models).where({ id: idx });
    },
    reset: function() {
      this.models = [];
    }
  };

  _.extend(C.prototype, opts);

  return C;
}

function View(opts) {
  function V(m) {
    this.model = m;
    this.model.addCallback(this.render.bind(this));
    this.model.__remove = this.remove.bind(this);
    this.model.view = this;
    this.attributes["data-id"] = this.model.id;
    this.$el = $("<" + this.tag_name + " />", this.attributes);
  }

  V.prototype = {
    tag_name: "div",
    template: function() { },
    attributes: {},
    events: {},
    render: function() {
      this.$el.html(this.template(this.model.attributes));
      this.bindEvents();
      return this.$el;
    },
    bindEvents: function() {
      var $el = this.$el,
          event, selector, parts;

      for (var prop in this.events) {
        parts = prop.split(" ");
        selector = parts.length > 1 ? parts[1] : undefined;
        event = parts[0];
        if (selector) {
          $el.on(event + ".view", this.events[prop]);
        }
        else {
          $el.on(event + ".view", selector, this.events[prop]);
        }
      }
    },
    unbindEvents: function() {
      this.$el.off(".view");
    },
    remove: function() {
      this.unbindEvents();
      this.$el.remove();
    },
    setElement: function(tag_name) {
      this.tag_name = tag_name;
      this.$el = $("<" + this.tag_name + " />", this.attributes);
    }
  };

  V.prototype = _.extend(V.prototype, opts);

  return V;
}
