(function(root){
'use strict';
class MusicPlayer {
 constructor(tracks,audio,random=Math.random){this.audio=audio;this.random=random;this.order=[];this.index=0;this.run=null;this.floor=0;this.dead=true;this.unlocked=false;audio.loop=true;audio.volume=.25;this.addTracks(tracks);}
 addTracks(tracks){const fresh=[...new Set(tracks)].filter(t=>!this.order.includes(t));for(let i=fresh.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[fresh[i],fresh[j]]=[fresh[j],fresh[i]];}const empty=!this.order.length;this.order.push(...fresh);if(empty&&fresh.length&&this.run)this.load();}
 load(){this.audio.pause();if(!this.order.length)return;this.audio.src=this.order[this.index];this.audio.currentTime=0;this.play();}
 play(){if(this.unlocked&&!this.dead&&this.order.length&&this.audio.paused)this.audio.play().catch(()=>{});}
 unlock(){this.unlocked=true;this.play();}
 sync(run){if(this.run!==run){const previous=!!this.run;this.run=run;this.floor=run.floor;this.dead=run.dead||run.won;if(previous&&this.order.length)this.index=(this.index+1)%this.order.length;this.load();}
 else if(run.dead||run.won){this.dead=true;this.audio.pause();this.audio.currentTime=0;}
 else{const steps=Math.floor((run.floor-this.floor)/2);if(steps>0){this.floor+=steps*2;if(this.order.length)this.index=(this.index+steps)%this.order.length;this.load();}this.play();}}
}
root.AriadneMusic=MusicPlayer;if(typeof module!=='undefined')module.exports=MusicPlayer;
})(globalThis);
