// --------- Factory ---------

angular.module('myApp').factory('Data', function($http, $routeParams) {

    var getData = function() {
        return $http({
                method: "GET",
                url: "/alles"
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
                $scope.data.questions[q].answer = 0;
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
        if (rating == 1) return "positive";
        if (rating == -1) return "negative";
        return "neutral";
    };

    /**
    voting system like bpb
    www.bpb.de/system/files/dokument_pdf/Rechenmodell%20des%20Wahl-O-Mat.pdf
    **/

    // get vaule how user match partie on base of 100
    $scope.getUserMatchPartieBase100 = function(partie) {
        if ($scope.totalPartieMatches === undefined) {
            calcTotalUserMatchPartie();
        }


        var userMatchValueBase100 = ($scope.totalPartieMatches.map.get(partie.id) / $scope.totalPartieMatches.sum) * 100;

        return userMatchValueBase100;
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

    function getSumOfMaxQuestionValues(questions){
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
        if (questionValue !== "") {
            return questionValue;
        } else {
            console.error("Error! questionValue is " + questionValue);
        }
    }





    $scope.getTotalPosition = function(partie) {
        var tmp = 0;
        for (var i = 0; i < $scope.data.questions.length; i++) {
            tmp += $scope.data.questions[i].answer * (1 + $scope.data.questions[i].accent) * $scope.data.questions[i].positions[partie.id - 1].vote;
        }
        tmp = tmp * 100 / $scope.data.questions.length;
        if (tmp > 100) {
            return 100;
        } else if (tmp < -100) {
            return -100;
        }
        return tmp;
    };

    $scope.getTotalPositionRound = function(partie) {
        // get TotalPosition of totalposition round to the next full number
        totalPosition = $scope.getTotalPosition(partie);
        return Math.round(totalPosition);
    };

    $scope.loadOrientationStyleH1 = function(partie) {
        var width = $scope.getUserMatchPartieBase100(partie);
        //var width = $scope.getTotalPosition(partie);
        if (width < 0) {
            return {
                "color": "#900",
                "box-shadow": "inset 0 0 0 2px #900"
            };
        }
        return {
            "color": "#360",
            "box-shadow": "inset 0 0 0 2px #360"
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

    $scope.getBarWidth = function(partie) {
        var width = $scope.getUserMatchPartieBase100(partie);
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
