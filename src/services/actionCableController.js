ngActionCable.factory('ActionCableController', function (ActionCableConfig) {

  // add a hash of callbacks here that `route_channel` will call on an incoming message.
  // actions format: actions[channelName][dataParams] = [callback1, callback2, ...]
  // e.g. actions["GlobalsData"][JSON.stringify({"responder_id":1})]= [function(message){...}, assignment_2: function(message){...}, ... ]
  var actions = {
    welcome: function(message){
      if (ActionCableConfig.debug) console.log('Willkommen');
    },
    ping: function(message){
      if (ActionCableConfig.debug) console.log('ActionCable ping');
    },
    _ping: function(message){                                                   // Rails5.0.0.beta3 backport
      if (ActionCableConfig.debug) console.log('ActionCable 5.0.0.beta3 ping'); // Rails5.0.0.beta3 backport
    },                                                                          // Rails5.0.0.beta3 backport
    confirm_subscription: function(message){
      if (ActionCableConfig.debug) console.log('ActionCable confirm_subscription on channel: ' + message.identifier);
    },
    ws_404: function(message){
      if (ActionCableConfig.debug) console.log('ActionCable route not found: ' + message);
    }
  };

  var routeToActions= function(actionCallbacks, message){
    angular.forEach(actionCallbacks, function(func, id){
      func.apply(null, [message]);
    });
  };

  var route = function(message){
    if (!!actions[message.type]) {
      actions[message.type](message);
      if (message.type == 'ping') methods.after_ping_callback();
    } else if (message.identifier == '_ping') {     // Rails5.0.0.beta3 backport
      actions._ping(message);                       // Rails5.0.0.beta3 backport
      methods.after_ping_callback();                // Rails5.0.0.beta3 backport
    } else if (!!findActionCallbacksForChannel(channel_from(message), params_from(message))) {
      var actionCallbacks= findActionCallbacksForChannel(channel_from(message), params_from(message));
      routeToActions(actionCallbacks, message.message);
    } else {
      actions.ws_404(message);
    }
  };


  function findActionCallbacksForChannel(channelName, params){
    return (actions[channelName] && actions[channelName][params]);
  }

  function channel_from(message){
    if (message && message.identifier) {
      return JSON.parse(message.identifier).channel;
    }
  }

  function params_from(message){
    var paramsData= JSON.parse(message.identifier).data;
    return JSON.stringify(paramsData);
  }


  var methods= {
    post: function(message){
      return route(message);
    },
    actions: actions,
    after_ping_callback: function(){}
  };

  return methods;
});
