(function(){
    var awUtil = angular.module('annoweb-util', []);
    /**
     * Random RGBA color.
     */
    awUtil.factory('randomColor', function(){
        var randomColor = function(alpha) {
            return 'rgba(' + [
                    ~~(Math.random() * 255),
                    ~~(Math.random() * 255),
                    ~~(Math.random() * 255),
                    alpha || 1
                ] + ')';
        }
        return (randomColor);
    });
    /*
     * Extract regions separated by silence.
     */
    awUtil.factory('extractRegions', function(){
            var extractRegions = function(peaks, duration) {
                // Silence params
                //var minValue = 0.0015;
                var minValue = 0.05;
                var minSeconds = 0.5;

                var length = peaks.length;
                var coef = duration / length;
                var minLen = minSeconds / coef;

                // Gather silence indeces
                var silences = [];
                Array.prototype.forEach.call(peaks, function (val, index) {
                    if (val < minValue) {
                        silences.push(index);
                    }
                });

                // Cluster silence values
                var clusters = [];
                silences.forEach(function (val, index) {
                    if (clusters.length && val == silences[index - 1] + 1) {
                        clusters[clusters.length - 1].push(val);
                    } else {
                        clusters.push([ val ]);
                    }
                });

                // Filter silence clusters by minimum length
                var fClusters = clusters.filter(function (cluster) {
                    return cluster.length >= minLen;
                });

                // Create regions on the edges of silences
                var regions = fClusters.map(function (cluster, index) {
                    var next = fClusters[index + 1];
                    return {
                        start: cluster[cluster.length - 1],
                        end: (next ? next[0] : length - 1)
                    };
                });

                // Add an initial region if the audio doesn't start with silence
                var firstCluster = fClusters[0];
                if (firstCluster && firstCluster[0] != 0) {
                    regions.unshift({
                        start: 0,
                        end: firstCluster[firstCluster.length - 1]
                    });
                }

                // Filter regions by minimum length
                var fRegions = regions.filter(function (reg) {
                    return reg.end - reg.start >= minLen;
                });

                // Return time-based regions
                return fRegions.map(function (reg) {
                    return {
                        start: Math.round(reg.start * coef * 10) / 10,
                        end: Math.round(reg.end * coef * 10) / 10
                    };
                });
            }
            return (extractRegions);
        })

        .directive('ngChatbox', [
            function() {
                return {
                    restrict: 'E',
                    templateUrl: 'views/templates/chat-template.html',
                    controllerAs: 'chat',
                    controller: chatboxController
                };
            }
        ])
        .directive('focusOn', function() {
            return function(scope, elem, attr) {
                scope.$on(attr.focusOn, function(e) {
                    elem[0].focus();
                });
            };
        });

    var chatboxController = function (FirebaseService, AnnowebDialog, Auth) {
        var vm = this;
        vm.auth = Auth;
        vm.auth.$onAuth(function(authData) {
            vm.authData = authData;
            if (vm.authData) {
                vm.user = vm.authData.facebook.displayName;
            } else {
                vm.user = '';
            }
        });
        vm.messages = FirebaseService;
        vm.addMessage = function() {
            // calling $add on a synchronized array is like Array.push(),
            // except that it saves the changes to our database!
            if (vm.user == null) {
                AnnowebDialog.toast('Enter your name first bozo!');
            } else {
                vm.messages.$add({
                    from: vm.user,
                    content: vm.message
                });
                vm.message = "";
            }
        };

    };
    chatboxController.$inject = ['FirebaseService', 'AnnowebDialog', 'Auth'];



})();

