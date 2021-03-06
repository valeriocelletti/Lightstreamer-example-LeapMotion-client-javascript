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
define(["Executor"],function(Executor) {
  
  var GameLoop = function(game,field,frameInterval,baseRate) {
    this.thread = null;
    this.game = game;
    this.field = field;
    
    this.frameInterval = frameInterval;
    this.rateFactor = frameInterval/baseRate;
  };
  
  GameLoop.prototype = {
     start: function() {
       if (this.thread) {
         return;
       }
       this.thread = Executor.addRepetitiveTask(this.calculate,this.frameInterval,this);
       
     },
     stop: function() {
       if (!this.thread) {
         return;
       }
       Executor.stopRepetitiveTask(this.thread);
       delete(this.thread);
     },
     calculate: function() {
       var f = this.rateFactor;
       this.game.forEachPlayer(function(player) {
         player.calculate(f);
       });
       this.field.render();
     }
  };
  
  
  return GameLoop;  
  
  
});
