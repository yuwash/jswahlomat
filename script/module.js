var app = angular.module('myApp', ['ngRoute']);

// ------------- Route -----------
app.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    templateUrl : 'static/pages/start.html'
  })
  .when('/start', {
    templateUrl : 'static/pages/start.html'
  })
  .when('/result', {
    templateUrl : 'static/pages/result.html'
  })
  .when('/questions', {
    templateUrl : 'static/pages/questions.html'
  })
  .when('/favorites', {
    templateUrl : 'static/pages/favorites.html'
  })
  .otherwise({redirectTo: '/'});
});
