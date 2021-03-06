/*
  Copyright 2014 Weswit Srl

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
define(["Inheritance","EventDispatcher","Subscription","./Constants","./ConsoleSubscriptionListener"],
    function(Inheritance,EventDispatcher,Subscription,Constants,ConsoleSubscriptionListener) {

  function generateId() {
    return "u-"+Math.round(Math.random()*1000);
  }
  
  var Player = function(nick,status,client) {
    this.initDispatcher();
    
    this.client = client;
    this.nick = nick;
    this.status = status;
    
    this.id = generateId(); 
    this.userSubscription = new Subscription("DISTINCT","user_"+this.id,["message","from"]); //USER_SUBSCRIPTION used only to signal presence
    this.userSubscription.setRequestedSnapshot("yes");
    this.userSubscription.addListener(this);
    this.client.subscribe(this.userSubscription);
    
    if (Constants.LOG_UPDATES_ON_CONSOLE) {
      this.userSubscription.addListener(new ConsoleSubscriptionListener("User"));
    }
    
    this.rooms = {};
    this.playing = false;
    
  };
  
  Player.prototype = {
    
      ready: function() {
        
        if (this.playing) {
          return;
        }
        this.playing = true;

        this.dispatchEvent("onIdConfirmed",[this.id]);
       
        //conf nick & status
        this.sendNick();
        this.sendStatus();
        
        //re-enter rooms
        for (var i in this.rooms) {
          this.enterRoomInternal(i);
        } 
      },
      
      reset: function() {
        /*if (!this.playing) {
          return;
        }*/
        this.playing = false;
      },
      
      retry: function() {
        this.id = generateId();
        this.client.unsubscribe(this.userSubscription);
        this.userSubscription.setItems(["user_"+this.id]);
        this.client.subscribe(this.userSubscription);
      },
      
      /**
       * @private
       */
      error: function(message) {
        this.dispatchEvent("onError",[message]);
      },
      
      /**
       * @private
       */
      sendRoomMessage: function(command,sequence,room) {
        if (!this.rooms[room]) {
          return;
        }
        this.sendMessage(command,sequence);
      },
      
      /**
       * @private
       */
      sendMessage: function(command,sequence) {
        if (!this.playing) {
          return;
        }
        this.client.sendMessage(command,sequence,0,this);
      },
      
      enterRoom: function(room) {
        if (this.rooms[room]){
          return;
        }
        
        this.enterRoomInternal(room);
        
        this.rooms[room] = true;
      },
      
      /**
       * @private
       */
      enterRoomInternal: function(room) {
        this.sendMessage("enter|"+room,"enterexit"+room);
      },
      
      exitRoom: function(room) {
        this.sendRoomMessage("leave|"+room,"enterexit"+room,room);
      },
      
      grab: function(room) {
        this.sendRoomMessage("grab|"+room,"3D",room);
      },
      
      release: function(room,sx,sy,sz) {
        this.sendRoomMessage("release|"+room+"|"+sx+"|"+sy+"|"+sz,"3D",room);
      },
      
      move: function(room,x,y,z) {
        this.sendRoomMessage("move|"+room+"|"+x+"|"+y+"|"+z,"3D",room);
      },
      
      changeNick: function(newNick) {
        if (this.nick == newNick) {
          return;
        }
        this.nick = newNick;
        this.sendNick();
      },
      
      /**
       * @private
       */
      sendNick: function() {
        if (!this.nick) {
          return;
        }
        this.sendMessage("nick|"+this.nick,"nick");
      },
      
      changeStatus: function(newStatus) {
        if (this.status == newStatus) {
          return;
        }
        this.status = newStatus;
        this.sendStatus();
      },
  
      /**
       * @private
       */
      sendStatus: function() {
        if (!this.status) {
          return;
        }
        this.sendMessage("status|"+this.status,"status");
      },
      
      //subscription listener-->
      
      onSubscription: function() {
        this.ready();
      },
      
      onUnsubscription: function() {
        this.reset();
      },
      
      onSubscriptionError: function(code,mex) {
        this.retry();
      },
      
      //message listener-->
     
      // onDiscarded onAbort onProcessed -> do nothing
      
      onDeny: function(originalMessage,code,message) {
        //Event handler that is called by Lightstreamer when the related message has been processed by the Server but the expected processing outcome could not be achieved for any reason.
        this.error(message);
      },
      
      onError: function() {
        this.error("Unexpected error");
      }
  };
  
  Inheritance(Player,EventDispatcher,true,true);
  return Player;
  
});