var App = {
  $el: $("#people"),
  $total: $("#total"),
  addPerson: function(name, title) {
    var person = App.people.add({
      name: name,
      title: title
    });

    var view = new App.View(person);

    view.render().appendTo(this.$el);
    this.renderTotal();
  },
  removePerson: function(e) {
    e.preventDefault();

    var $e = $(e.target).closest("li");

    this.people.remove(+$e.attr("data-id"));
    this.renderTotal();
  },
  renderTotal: function() {
    this.$total.find("strong").text(this.people.models.length);
  }
};

App.View = new View({
  tag_name: "li",
  template: Handlebars.compile($("#person").html()),
  events: {
    "click a.remove": App.removePerson.bind(App)
  }
});

App.Person = new Model();
App.People = new Collection();
App.people = new App.People(App.Person);

$("form").on("submit", function(e) {
  e.preventDefault();
  var $f = $(this),
      name = $f.find("#name").val(),
      title = $f.find("#title").val(),
      view;

  if (!name || !title) {
    return;
  }

  App.addPerson(name, title);

  $f[0].reset();
});
