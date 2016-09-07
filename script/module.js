var app = angular.module('myApp', ['ngRoute']);

// ------------- Route -----------
app.config(function($routeProvider) {
  $routeProvider
  .when('/', {
    // TODO fix url befor shiping
    // templateUrl : 'static/pages/start.html'
    templateUrl : 'pages/start.html'
  })
  .when('/start', {
    // TODO fix url befor shiping
    // templateUrl : 'static/pages/start.html'
    templateUrl : 'pages/start.html'
  })
  .when('/result', {
    // TODO fix url befor shiping
    // templateUrl : 'static/pages/result.html'
    templateUrl : 'pages/result.html'
  })
  .when('/questions', {
    // TODO fix url befor shiping
    // templateUrl : 'static/pages/questions.html'
    templateUrl : 'pages/questions.html'
  })
  .when('/favorites', {
    // TODO fix url befor shiping
    // templateUrl : 'static/pages/favorites.html'
    templateUrl : 'pages/favorites.html'
  })
  .otherwise({redirectTo: '/'});
});
