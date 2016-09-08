// --------- Factory ---------

angular.module('myApp').factory('Data', function($http, $routeParams) {

    var getData = function() {
        return $http({
                method: "GET",
                url: "extpages/externalJSON.json"
            })
            .then(function(extern) {
                return extern.data;
            });
    };
    return {
        getData: getData
    };
});

// ---------- Loading function ------------

function myFunction($scope, Data) {
    var myDataPromise = Data.getData();
    myDataPromise.then(function(result) {
        if ($scope.data === undefined) {
            $scope.data = result;

            var partyCount = [];
            partyCount.length = $scope.data.parties.length;
            partyCount.fill(0);

            //add accent null to alle questions
            for (var q in $scope.data.questions) {
                $scope.data.questions[q].accent = 0;
                $scope.data.questions[q].answer = false;
            }
            /*
            for(q in $scope.data.questions){
              for(p in $scope.data.parties){
                if($scope.data.questions[q].positions[p].orientation == 0){
                  partyCount[p]++;
                }
              }
            }
            */
        }
    });
}

//  ---------- Main Controller ------------

app.controller('MainCtrl', function($scope, $http, Data, $rootScope, $routeParams) {

    $scope.question_nr = 0;
    $scope.title1 = "Startseite";
    $scope.wasLastQuestion = false;
    $scope.visibleParty = null;

    // load Data
    myFunction($scope, Data);

    // get categorie of question.cat_id
    $scope.getCategorie = function(cat_id) {
        // search cat_id in content.categories array and return categorie name
        for (var cat in $scope.data.categories) {
            if (cat_id === $scope.data.categories[cat].id) {
                return $scope.data.categories[cat].name;
            }
        }
    };

    $scope.isLastQuestion = function() {
        return $scope.wasLastQuestion;
    };

    $scope.correct = function() {
        $scope.wasLastQuestion = false;
    };

    $scope.newStart = function() {
        $scope.question_nr = 0;
        $scope.wasLastQuestion = false;
        for (var q in $scope.data.questions) {
            $scope.data.questions[q].accent = 0;
            $scope.data.questions[q].answer = false;
            $scope.data.questions[q].matches = {};
        }
    };

    $scope.forward = function() {
        if ($scope.question_nr < $scope.data.questions.length - 1) {
            $scope.question_nr = $scope.question_nr + 1;
        } else {
            $scope.wasLastQuestion = true;
        }
    };
    $scope.jumpTo = function(index) {
        $scope.question_nr = index;
    };

    $scope.back = function() {
        if ($scope.question_nr > 0) {
            $scope.question_nr = $scope.question_nr - 1;
        } else {
            window.location.href = "#/start";
        }
    };
    $scope.historyBoxStyle = function(index) {
        var a = "";
        if ($scope.question_nr == index) {
            a = "active";
        }
        return a + " " + $scope.getRating($scope.data.questions[index].answer);
    };

    $scope.vote = function(rating) {
        $scope.data.questions[$scope.question_nr].answer = rating;
    };

    $scope.getFav = function(isFav) {
        if (isFav) return "fa fa-star";
        return "fa fa-star-o";
    };

    $scope.getRating = function(rating) {
        if (rating === 2) {
            return "positive";
        } else if (rating === 0) {
            return "negative";
        } else if (rating === 1) {
            return "neutral"
        } else if (rating === false) {
            return "skip";
        }
        return "skip";
    };

    /**
    voting system like bpb
    www.bpb.de/system/files/dokument_pdf/Rechenmodell%20des%20Wahl-O-Mat.pdf
    **/


    $scope.getMatchesArray = function() {
        /*
         * get sorted array for result page
         */

        //def Array
        var matchArray = [];

        //loob all parties and get Match
        var parties = $scope.data.parties;
        for (var pIndex in parties) {
            var partie = parties[pIndex];
            partie.match = $scope.getUserMatchPartieBase100(partie);
            //Save Match in Array as key value object
            matchArray.push(partie);
        }
        //Sort Array bey value
        matchArray.sort(function(a, b) {
            // sort array by heighest match
            if (a.match > b.match) {
                return -1;
            }
            if (a.match < b.match) {
                return 1;
            }
            // a must be equal to b
            return 0;
        });

        //return Array
        return matchArray;
    };

    // get vaule how user match partie on base of 100
    $scope.getUserMatchPartieBase100 = function(partie) {
        calcTotalUserMatchPartie();

        if ($scope.totalPartieMatches.sum === 0) {
            var userMatchValueBase100 = 0
        } else {
            var userMatchValueBase100 = ($scope.totalPartieMatches.map.get(partie.id) / $scope.totalPartieMatches.sum) * 100;
        };
        return Math.round(userMatchValueBase100);
    };

    function calcTotalUserMatchPartie() {
        calcUserMatchPartieQuestions();
        // calc total matches by parties
        var questions = $scope.data.questions;

        $scope.totalPartieMatches = {};
        $scope.totalPartieMatches.map = new Map();
        $scope.totalPartieMatches.sum = 0;

        for (var partieIndex in $scope.data.parties) {
            totalMatch = 0;
            for (var qIndex in questions) {
                var question = questions[qIndex];
                totalMatch += parseInt(question.matches[$scope.data.parties[partieIndex].id]);
            }
            $scope.totalPartieMatches.map.set($scope.data.parties[partieIndex].id, totalMatch);
        }
        getSumOfMaxQuestionValues(questions);
    }

    function getSumOfMaxQuestionValues(questions) {
        var totalPartieMatches = $scope.totalPartieMatches;
        for (var qIndex in questions) {
            var question = questions[qIndex];
            totalPartieMatches.sum += question.matches.maxQuestionValue;
        }
    }

    function calcUserMatchPartieQuestions() {
        var questions = $scope.data.questions;
        for (var qIndex in questions) {
            var question = questions[qIndex];
            //skip question
            addMatches(question, question.positions, questions);
            question.matches.maxQuestionValue = getmaxQuestionValue(question.matches);
        }
    }

    function addMatches(question, positions, questions) {
        question.matches = {};
        for (var pIndex in positions) {
            var position = positions[pIndex];
            // calcQuestionValue
            var questionValue = calcQuestionValue(position, question);
            question.matches[position.orientation] = questionValue;
        }
    }

    function getmaxQuestionValue(matches) {
        // object matches to array.
        var matchValueArray = Object.keys(matches).map(
            function(key) {
                return matches[key];
            });
        // get maximal vaule of partie matches
        var maxQuestionValue = Math.max.apply(Math, matchValueArray);
        return maxQuestionValue;
    }

    function calcQuestionValue(position, question) {
        var questionValue = "",
            userAnswer = question.answer,
            accent = question.accent;

        //if user skiped the question then skip question in calc
        if (userAnswer === false) {
            questionValue = 0;
            return questionValue;
        }

        if (accent === true) {
            if (userAnswer === 2 && position.vote === 2) {
                questionValue = 4;
            } else if (userAnswer === 2 && position.vote === 1) {
                questionValue = 2;
            } else if (userAnswer === 2 && position.vote === 0) {
                questionValue = 0;
            } else if (userAnswer === 1 && position.vote === 2) {
                questionValue = 2;
            } else if (userAnswer === 1 && position.vote === 1) {
                questionValue = 4;
            } else if (userAnswer === 1 && position.vote === 1) {
                questionValue = 2;
            } else if (userAnswer === 0 && position.vote === 2) {
                questionValue = 0;
            } else if (userAnswer === 0 && position.vote === 1) {
                questionValue = 2;
            } else if (userAnswer === 0 && position.vote === 0) {
                questionValue = 4;
            }
        } else if (accent === false || accent === 0) {
            if (userAnswer === 2 && position.vote === 2) {
                questionValue = 2;
            } else if (userAnswer === 2 && position.vote === 1) {
                questionValue = 1;
            } else if (userAnswer === 2 && position.vote === 0) {
                questionValue = 0;
            } else if (userAnswer === 1 && position.vote === 2) {
                questionValue = 1;
            } else if (userAnswer === 1 && position.vote === 1) {
                questionValue = 2;
            } else if (userAnswer === 1 && position.vote === 0) {
                questionValue = 1;
            } else if (userAnswer === 0 && position.vote === 2) {
                questionValue = 0;
            } else if (userAnswer === 0 && position.vote === 1) {
                questionValue = 1;
            } else if (userAnswer === 0 && position.vote === 0) {
                questionValue = 2;
            }
        }
        return questionValue;
    }

    $scope.getTotalPositionRound = function(partie) {
        // get TotalPosition of totalposition round to the next full number
        totalPosition = $scope.getTotalPosition(partie);
        return Math.round(totalPosition);
    };

    $scope.loadOrientationStyleH1 = function(width) {
        //var width = $scope.getUserMatchPartieBase100(partie);
        //var width = $scope.getTotalPosition(partie);
        if (width < 0) {
            return {
                "color": "white",

            };
        }
        return {
            "color": "white",

        };
    };

    $scope.getOrientationClass = function(partie) {
        var width = $scope.getUserMatchPartieBase100(partie);
        //var width = $scope.getTotalPosition(partie);
        if (width < 0) {
            return "negative";
        }
        return "positive";
    };

    $scope.getBarWidth = function(width) {
        //var width = $scope.getUserMatchPartieBase100(partie);
        //var width = $scope.getTotalPosition(partie);
        if (width < 0) {
            return {
                "width": Math.abs(width) + "%",
                "backgroundColor": "#ff9933"
            };
        }
        return {
            "width": Math.abs(width) + "%",
            "backgroundColor": "#66cc00"
        };
    };

    $scope.setPartyVisible = function(partie) {
        if (partie.id == $scope.visibleParty) {
            $scope.visibleParty = null;
        } else {
            $scope.visibleParty = partie.id;
        }
    };

    $scope.isPartyVisible = function(partie) {
        return partie.id == $scope.visibleParty;
    };
});
