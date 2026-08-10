(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const math = {
    sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,atan2:Math.atan2,
    exp:Math.exp,log:Math.log,log2:Math.log2,pow:Math.pow,sqrt:x=>x<0?0:Math.sqrt(x),abs:Math.abs,
    sign:Math.sign,floor:Math.floor,ceil:Math.ceil,round:Math.round,trunc:Math.trunc,min:Math.min,max:Math.max,tanh:Math.tanh,
    clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),
    fold:(x,a,b)=>{const s=b-a;if(!(s>0))return a;let y=(x-a)%(2*s);if(y<0)y+=2*s;return a+(y<=s?y:2*s-y)},
    fract:x=>x-Math.floor(x),step:(edge,x=0)=>x>=edge?1:0,mix:(a,b,t)=>a+(b-a)*t,cycle:Math.sin,
    saw:x=>2*(x-Math.floor(x))-1,tri:x=>1-4*Math.abs((x-Math.floor(x))-.5),square:x=>(x-Math.floor(x))<.5?1:-1,pulse:(x,w=.5)=>(x-Math.floor(x))<Math.max(0,Math.min(1,w))?1:-1,
    mod:(a,b)=>((a%b)+b)%b,xor:(a,b)=>a^b,pick:(i,...xs)=>xs[Math.max(0,Math.min(xs.length-1,i|0))]??0,pi:Math.PI,twopi:TAU,e:Math.E
  };
  const builtins = new Set(Object.keys(math));
  const sampleVars = ["t","ph","n","sr","freq","note","gate","vel","x","y","in1","in2"];
  const forbidden = /\b(?:window|document|globalThis|self|top|parent|frames|location|navigator|fetch|XMLHttpRequest|Function|constructor|prototype|__proto__|import|export|new|class|function|return|while|for|do|switch|try|catch|throw|with|debugger|this|eval|arguments)\b/;
  const presets = {
    lissajous:{x:"let drift = 0.12 * sin(t * 0.7)\nsin(twopi * (3 + drift) * ph)",y:"Param wobble (0.16, min=0, max=1)\nlet bend = wobble * sin(twopi * 0.18 * t)\nsin(twopi * (2 + bend) * ph + pi / 2)"},
    waveLab:{x:"# wave: 0=sine 1=triangle 2=saw 3=pulse\nParam waveX (1, min=0, max=3)\nParam waveY (2, min=0, max=3)\nParam ratioX (3, min=1, max=12)\nParam ratioY (2, min=1, max=12)\nParam pulseX (0.25, min=0.02, max=0.98)\nParam pulseY (0.50, min=0.02, max=0.98)\nParam phaseY (0.25, min=0, max=1)\nlet p=phasor(round(ratioX))\nlet w=round(waveX)\n(w==0?sin(twopi*p):w==1?tri(p):w==2?saw(p):pulse(p,pulseX))",y:"let p=fract(ph*round(ratioY)+phaseY)\nlet w=round(waveY)\n(w==0?sin(twopi*p):w==1?tri(p):w==2?saw(p):pulse(p,pulseY))"},
    triangleSaw:{x:"let p=phasor(3)\ntri(p)",y:"let p=fract(ph*2+0.25)\nsaw(p)"},
    pulseSine:{x:"Param width (0.22, min=0.02, max=0.98)\nlet p=phasor(3)\npulse(p,width)",y:"sin(twopi*phasor(2)+pi/2)"},
    sawSquare:{x:"saw(phasor(3))",y:"square(fract(ph*2+0.125))"},
    stepCircles:{x:"Param count (6, min=2, max=12)\nParam rate (0.12, min=-2, max=2)\nParam steps (24, min=4, max=64)\nParam baseSize (0.68, min=0, max=1.5)\nParam shapeSize (0.18, min=0.02, max=0.8)\nlet c=round(count)\nlet s=max(1,round(steps))\nlet slot=floor(ph*c)\nlet local=fract(ph*c)\nlet turn=floor(t*rate*s)/s\nlet center=twopi*(slot/c+turn)\nshapeSize*cos(twopi*local)+baseSize*cos(center)",y:"let c=round(count)\nlet s=max(1,round(steps))\nlet slot=floor(ph*c)\nlet local=fract(ph*c)\nlet turn=floor(t*rate*s)/s\nlet center=twopi*(slot/c+turn)\nshapeSize*sin(twopi*local)+baseSize*sin(center)"},
    stepLissajous:{x:"Param count (5, min=2, max=10)\nParam rate (0.12, min=-2, max=2)\nParam steps (24, min=4, max=64)\nParam baseSize (0.68, min=0, max=1.5)\nParam shapeSize (0.18, min=0.02, max=0.8)\nlet c=round(count)\nlet s=max(1,round(steps))\nlet slot=floor(ph*c)\nlet local=fract(ph*c)\nlet turn=floor(t*rate*s)/s\nlet center=twopi*(slot/c+turn)\nshapeSize*sin(twopi*3*local)+baseSize*cos(center)",y:"let c=round(count)\nlet s=max(1,round(steps))\nlet slot=floor(ph*c)\nlet local=fract(ph*c)\nlet turn=floor(t*rate*s)/s\nlet center=twopi*(slot/c+turn)\nshapeSize*sin(twopi*2*local+pi/2)+baseSize*sin(center)"},
    orbit:{x:"Param orbit (0.32, min=0, max=1)\nlet a = sin(twopi * ph)\na + orbit * sin(twopi * 7 * ph + t)",y:"let b = cos(twopi * ph)\nb + 0.28 * cos(twopi * 5 * ph - t * 0.8)"},
    astroid:{x:"Param corners (4, min=3, max=12)\nParam rotate (0.08, min=-2, max=2)\nlet c=round(corners)\nlet a=twopi*ph\nlet x0=((c-1)*cos(a)+cos((c-1)*a))/c\nlet y0=((c-1)*sin(a)-sin((c-1)*a))/c\nlet r=twopi*t*rotate\nx0*cos(r)-y0*sin(r)",y:"let c=round(corners)\nlet a=twopi*ph\nlet x0=((c-1)*cos(a)+cos((c-1)*a))/c\nlet y0=((c-1)*sin(a)-sin((c-1)*a))/c\nlet r=twopi*t*rotate\nx0*sin(r)+y0*cos(r)"},
    hypotrochoid:{x:"Param corners (5, min=3, max=12)\nParam pen (1.55, min=0.1, max=3)\nParam rotate (0.08, min=-2, max=2)\nlet c=round(corners)\nlet a=twopi*ph\nlet x0=((c-1)*cos(a)+pen*cos((c-1)*a))/(c-1+pen)\nlet y0=((c-1)*sin(a)-pen*sin((c-1)*a))/(c-1+pen)\nlet r=twopi*t*rotate\nx0*cos(r)-y0*sin(r)",y:"let c=round(corners)\nlet a=twopi*ph\nlet x0=((c-1)*cos(a)+pen*cos((c-1)*a))/(c-1+pen)\nlet y0=((c-1)*sin(a)-pen*sin((c-1)*a))/(c-1+pen)\nlet r=twopi*t*rotate\nx0*sin(r)+y0*cos(r)"},
    polygon:{x:"Param sides (5, min=3, max=12)\nParam tooth (0, min=0, max=0.95)\nParam rotate (0.08, min=-2, max=2)\nlet s=round(sides)\nlet u=ph*s\nlet k=floor(u)\nlet f=fract(u)\nlet ax=cos(twopi*k/s)\nlet ay=sin(twopi*k/s)\nlet bx=cos(twopi*(k+1)/s)\nlet by=sin(twopi*(k+1)/s)\nlet mx=(ax+bx)*0.5*(1-tooth)\nlet my=(ay+by)*0.5*(1-tooth)\nlet x0=f<0.5?mix(ax,mx,f*2):mix(mx,bx,(f-0.5)*2)\nlet y0=f<0.5?mix(ay,my,f*2):mix(my,by,(f-0.5)*2)\nlet r=twopi*t*rotate\nx0*cos(r)-y0*sin(r)",y:"let s=round(sides)\nlet u=ph*s\nlet k=floor(u)\nlet f=fract(u)\nlet ax=cos(twopi*k/s)\nlet ay=sin(twopi*k/s)\nlet bx=cos(twopi*(k+1)/s)\nlet by=sin(twopi*(k+1)/s)\nlet mx=(ax+bx)*0.5*(1-tooth)\nlet my=(ay+by)*0.5*(1-tooth)\nlet x0=f<0.5?mix(ax,mx,f*2):mix(mx,bx,(f-0.5)*2)\nlet y0=f<0.5?mix(ay,my,f*2):mix(my,by,(f-0.5)*2)\nlet r=twopi*t*rotate\nx0*sin(r)+y0*cos(r)"},
    cube:{x:"Param rotX (0.04, min=-2, max=2)\nParam rotY (0.07, min=-2, max=2)\nParam rotZ (0.025, min=-2, max=2)\nlet seg=floor(ph*16)\nlet id=pick(seg,0,1,3,2,0,4,5,7,3,2,6,7,6,4,5,1)\nlet idn=pick(seg,1,3,2,0,4,5,7,3,2,6,7,6,4,5,1,0)\nlet u=fract(ph*16)\nlet px=mix((id&1)?1:-1,(idn&1)?1:-1,u)\nlet py=mix((id&2)?1:-1,(idn&2)?1:-1,u)\nlet pz=mix((id&4)?1:-1,(idn&4)?1:-1,u)\nlet ax=twopi*t*rotX+0.55\nlet ay=twopi*t*rotY+0.72\nlet az=twopi*t*rotZ\nlet x1=px\nlet y1=py*cos(ax)-pz*sin(ax)\nlet z1=py*sin(ax)+pz*cos(ax)\nlet x2=x1*cos(ay)+z1*sin(ay)\nlet y2=y1\nlet z2=-x1*sin(ay)+z1*cos(ay)\nlet rx=x2*cos(az)-y2*sin(az)\nlet ry=x2*sin(az)+y2*cos(az)\nrx*2.7/(4+z2)",y:"let seg=floor(ph*16)\nlet id=pick(seg,0,1,3,2,0,4,5,7,3,2,6,7,6,4,5,1)\nlet idn=pick(seg,1,3,2,0,4,5,7,3,2,6,7,6,4,5,1,0)\nlet u=fract(ph*16)\nlet px=mix((id&1)?1:-1,(idn&1)?1:-1,u)\nlet py=mix((id&2)?1:-1,(idn&2)?1:-1,u)\nlet pz=mix((id&4)?1:-1,(idn&4)?1:-1,u)\nlet ax=twopi*t*rotX+0.55\nlet ay=twopi*t*rotY+0.72\nlet az=twopi*t*rotZ\nlet x1=px\nlet y1=py*cos(ax)-pz*sin(ax)\nlet z1=py*sin(ax)+pz*cos(ax)\nlet x2=x1*cos(ay)+z1*sin(ay)\nlet y2=y1\nlet z2=-x1*sin(ay)+z1*cos(ay)\nlet rx=x2*cos(az)-y2*sin(az)\nlet ry=x2*sin(az)+y2*cos(az)\nry*2.7/(4+z2)"},
    tetrahedron:{x:"Param rotX (0.035, min=-2, max=2)\nParam rotY (0.065, min=-2, max=2)\nParam rotZ (0.02, min=-2, max=2)\nlet seg=floor(ph*8)\nlet id=pick(seg,0,1,2,3,1,0,3,2)\nlet idn=pick(seg,1,2,3,1,0,3,2,0)\nlet u=fract(ph*8)\nlet px=mix(id<2?1:-1,idn<2?1:-1,u)\nlet py=mix((id==0||id==2)?1:-1,(idn==0||idn==2)?1:-1,u)\nlet pz=mix((id==0||id==3)?1:-1,(idn==0||idn==3)?1:-1,u)\nlet ax=twopi*t*rotX+0.45\nlet ay=twopi*t*rotY+0.62\nlet az=twopi*t*rotZ\nlet x1=px\nlet y1=py*cos(ax)-pz*sin(ax)\nlet z1=py*sin(ax)+pz*cos(ax)\nlet x2=x1*cos(ay)+z1*sin(ay)\nlet y2=y1\nlet z2=-x1*sin(ay)+z1*cos(ay)\nlet rx=x2*cos(az)-y2*sin(az)\nlet ry=x2*sin(az)+y2*cos(az)\nrx*2.7/(4+z2)",y:"let seg=floor(ph*8)\nlet id=pick(seg,0,1,2,3,1,0,3,2)\nlet idn=pick(seg,1,2,3,1,0,3,2,0)\nlet u=fract(ph*8)\nlet px=mix(id<2?1:-1,idn<2?1:-1,u)\nlet py=mix((id==0||id==2)?1:-1,(idn==0||idn==2)?1:-1,u)\nlet pz=mix((id==0||id==3)?1:-1,(idn==0||idn==3)?1:-1,u)\nlet ax=twopi*t*rotX+0.45\nlet ay=twopi*t*rotY+0.62\nlet az=twopi*t*rotZ\nlet x1=px\nlet y1=py*cos(ax)-pz*sin(ax)\nlet z1=py*sin(ax)+pz*cos(ax)\nlet x2=x1*cos(ay)+z1*sin(ay)\nlet y2=y1\nlet z2=-x1*sin(ay)+z1*cos(ay)\nlet rx=x2*cos(az)-y2*sin(az)\nlet ry=x2*sin(az)+y2*cos(az)\nry*2.7/(4+z2)"},
    bits:{x:"let q = (n >> 5) & 31\n(q / 15.5) - 1",y:"let a = ((n * 5) & (n >> 7)) & 255\n(a / 127.5) - 1"},
    rose:{x:"Param petals (5, min=2, max=12)\nlet r = cos(petals * twopi * ph + t * 0.2)\nr * cos(twopi * ph)",y:"let r = cos(petals * twopi * ph + t * 0.2)\nr * sin(twopi * ph)"}
  };
  const keyMap={a:0,s:1,d:2,f:3,g:4,h:5,j:6,k:7,l:8,";":9,":":9,q:5,w:6,e:7,r:8,t:9,y:10,u:11,i:12,o:13,p:14,"[":15,"]":16,"1":10,"2":11,"3":12,"4":13,"5":14,"6":15,"7":16,"8":17,"9":18,"0":19,"-":20,"=":21,z:-5,x:-4,c:-3,v:-2,b:-1,n:0,m:1,",":2,".":3,"/":4,"?":4};
  const displayKeys=["z","x","c","v","b","n","m",",",".","a","s","d","f","g","h","j","k"];
  function shikeiWorkletModule(){
    const workletMath={
      sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,atan2:Math.atan2,
      exp:Math.exp,log:Math.log,log2:Math.log2,pow:Math.pow,sqrt:x=>x<0?0:Math.sqrt(x),abs:Math.abs,
      sign:Math.sign,floor:Math.floor,ceil:Math.ceil,round:Math.round,trunc:Math.trunc,min:Math.min,max:Math.max,tanh:Math.tanh,
      clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),fold:(x,a,b)=>{const s=b-a;if(!(s>0))return a;let y=(x-a)%(2*s);if(y<0)y+=2*s;return a+(y<=s?y:2*s-y)},
      fract:x=>x-Math.floor(x),step:(edge,x=0)=>x>=edge?1:0,mix:(a,b,t)=>a+(b-a)*t,cycle:Math.sin,
      saw:x=>2*(x-Math.floor(x))-1,tri:x=>1-4*Math.abs((x-Math.floor(x))-.5),square:x=>(x-Math.floor(x))<.5?1:-1,pulse:(x,w=.5)=>(x-Math.floor(x))<Math.max(0,Math.min(1,w))?1:-1,
      mod:(a,b)=>((a%b)+b)%b,xor:(a,b)=>a^b,pick:(i,...xs)=>xs[Math.max(0,Math.min(xs.length-1,i|0))]??0,pi:Math.PI,twopi:Math.PI*2,e:Math.E
    };
    class ShikeiProcessor extends AudioWorkletProcessor{
      constructor(){
        super();this.voices=new Map();this.params={};this.programX=null;this.programY=null;this.evalX=null;this.evalY=null;this.volume=.34;
        this.effects={filterType:"off",cutoff:5000,resonance:.71,phaserMix:0,phaserRate:.3,overdrive:0,foldAmount:0,foldThreshold:1};
        this.coeff={b0:1,b1:0,b2:0,a1:0,a2:0};
        this.channels=Array.from({length:2},()=>({x1:0,x2:0,y1:0,y2:0,phaseX:new Float64Array(4),phaseY:new Float64Array(4),dcIn:0,dcOut:0}));
        this.attack=1-Math.exp(-1/(sampleRate*.006));this.release=1-Math.exp(-1/(sampleRate*.035));
        this.port.onmessage=e=>this.message(e.data);
      }
      message(data){
        if(data.type==="program"){this.programX=data.x;this.programY=data.y;this.params=data.params||{};this.rebuild()}
        else if(data.type==="params"){this.params=data.params||{};this.rebuild()}
        else if(data.type==="volume")this.volume=Math.max(0,Math.min(1,+data.value||0));
        else if(data.type==="effects"){this.effects={...this.effects,...data.value};this.updateFilter()}
        else if(data.type==="noteOn"){const old=this.voices.get(data.key);this.voices.set(data.key,{step:data.step,freq:data.freq,phase:old?.phase||0,gain:old?.gain||0,target:1})}
        else if(data.type==="noteOff"){const voice=this.voices.get(data.key);if(voice)voice.target=0}
        else if(data.type==="panic")this.voices.clear();
      }
      evaluator(program){
        if(!program)return null;
        try{const raw=Function(...program.args,program.body);return raw.bind(null,...Object.values(workletMath),...program.externalNames.map(name=>this.params[name]??0))}catch{return null}
      }
      rebuild(){this.evalX=this.evaluator(this.programX);this.evalY=this.evaluator(this.programY)}
      updateFilter(){
        const f=Math.max(20,Math.min(sampleRate*.45,+this.effects.cutoff||5000)),q=Math.max(.1,+this.effects.resonance||.71),w=2*Math.PI*f/sampleRate,alpha=Math.sin(w)/(2*q),c=Math.cos(w);
        let b0=1,b1=0,b2=0,a0=1,a1=0,a2=0;
        if(this.effects.filterType==="lowpass"){b0=(1-c)/2;b1=1-c;b2=(1-c)/2;a0=1+alpha;a1=-2*c;a2=1-alpha}
        else if(this.effects.filterType==="highpass"){b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2;a0=1+alpha;a1=-2*c;a2=1-alpha}
        else if(this.effects.filterType==="bandpass"){b0=alpha;b1=0;b2=-alpha;a0=1+alpha;a1=-2*c;a2=1-alpha}
        this.coeff.b0=b0/a0;this.coeff.b1=b1/a0;this.coeff.b2=b2/a0;this.coeff.a1=a1/a0;this.coeff.a2=a2/a0;
      }
      foldSample(x,amount,threshold){
        if(amount<=0)return x;const limit=Math.max(.05,threshold),drive=1+amount*6,mix=amount*.82,folded=limit*Math.sin(x/limit*drive)/(1+amount*.35);return x+(folded-x)*mix;
      }
      phaserSample(x,t,channel){
        const mix=Math.max(0,Math.min(1,+this.effects.phaserMix||0));if(mix<=0)return x;
        const state=this.channels[channel],rate=Math.max(.01,+this.effects.phaserRate||.3),f=280+1500*(.5+.5*Math.sin(2*Math.PI*rate*t)),g=(1-Math.tan(Math.PI*f/sampleRate))/(1+Math.tan(Math.PI*f/sampleRate));let wet=x;
        for(let i=0;i<4;i++){const y=-g*wet+state.phaseX[i]+g*state.phaseY[i];state.phaseX[i]=wet;state.phaseY[i]=y;wet=y}
        return x+(wet-x)*mix;
      }
      filterSample(x,channel){
        if(this.effects.filterType==="off")return x;const b=this.coeff,state=this.channels[channel],y=b.b0*x+b.b1*state.x1+b.b2*state.x2-b.a1*state.y1-b.a2*state.y2;state.x2=state.x1;state.x1=x;state.y2=state.y1;state.y1=y;return y;
      }
      applyEffects(x,t,channel){
        x=this.foldSample(x,+this.effects.foldAmount||0,+this.effects.foldThreshold||1);const drive=1+(+this.effects.overdrive||0)*24;if(drive>1)x=Math.tanh(x*drive)/Math.tanh(drive);x=this.phaserSample(x,t,channel);return this.filterSample(x,channel);
      }
      process(inputs,outputs){
        const left=outputs[0]?.[0],right=outputs[0]?.[1]||left;if(!left)return true;
        for(let i=0;i<left.length;i++){
          const t=(currentFrame+i)/sampleRate,n=currentFrame+i;let sumX=0,sumY=0,count=0;
          for(const [key,voice] of this.voices){
            voice.gain+=(voice.target-voice.gain)*(voice.target?this.attack:this.release);
            if(!voice.target&&voice.gain<.00005){this.voices.delete(key);continue}
            voice.phase+=voice.freq/sampleRate;voice.phase-=Math.floor(voice.phase);
            let x=0,y=0;
            try{x=this.evalX?this.evalX(t,voice.phase,n,sampleRate,voice.freq,voice.step,voice.target,.8,0,0,1,0):0;y=this.evalY?this.evalY(t,voice.phase,n,sampleRate,voice.freq,voice.step,voice.target,.8,x,0,1,0):0}catch{}
            sumX+=Math.max(-4,Math.min(4,x*.42))*voice.gain;sumY+=Math.max(-4,Math.min(4,y*.42))*voice.gain;count++;
          }
          const norm=Math.sqrt(count)||1,effectedX=count?this.applyEffects(sumX/norm,t,0):0,effectedY=count?this.applyEffects(sumY/norm,t,1):0;
          const limitedX=Math.tanh(effectedX)*this.volume*.5,limitedY=Math.tanh(effectedY)*this.volume*.5,lState=this.channels[0],rState=this.channels[1];
          const blockedX=limitedX-lState.dcIn+.995*lState.dcOut,blockedY=limitedY-rState.dcIn+.995*rState.dcOut;lState.dcIn=limitedX;lState.dcOut=blockedX;rState.dcIn=limitedY;rState.dcOut=blockedY;left[i]=blockedX;right[i]=blockedY;
        }
        return true;
      }
    }
    registerProcessor("shikei-processor",ShikeiProcessor);
  }
  let scale={degrees:[1],period:2};
  let compiled={x:null,y:null};
  let paramDefs=[];
  let running=true,startTime=performance.now()/1000,frozenTime=0;
  let audioCtx=null,audioNode=null,workletUrl=null;
  const held=new Map();
  let currentStep=0;

  function status(message,ok=true){$("status").textContent=message;$("status").dataset.kind=ok?"ok":"error"}
  function stripComment(line){return line.replace(/(#|\/\/).*$/,"").trim().replace(/;+$/,"").trim()}
  function parseParam(line){
    const m=line.match(/^Param\s+([A-Za-z_][A-Za-z0-9_]*)\s*\((.*)\)$/i);if(!m)return null;
    const parts=m[2].split(",").map(v=>v.trim()),value=Number(parts[0]);
    let min=Math.min(0,value||0),max=Math.max(1,value||1);
    for(const part of parts.slice(1)){const kv=part.split("=").map(v=>v.trim());if(kv[0]==="min"&&Number.isFinite(+kv[1]))min=+kv[1];if(kv[0]==="max"&&Number.isFinite(+kv[1]))max=+kv[1]}
    return {name:m[1],value:Number.isFinite(value)?value:min,min,max:max>min?max:min+1};
  }
  function transformCaret(source){return $("caretPower").checked?source.replace(/\^/g,"**"):source}
  function compileFormula(source,label,externalNames,preferredOutput){
    if(forbidden.test(source))throw new Error(`${label}: 使用できない語が含まれます`);
    if(/[\[\]{}'"`\\$]/.test(source))throw new Error(`${label}: 使用できない文字が含まれます`);
    const lines=source.split(/\r?\n/).map(stripComment).filter(Boolean),declarations=[],expressions=[],declared=new Set();
    for(const line of lines){
      if(/^Param\s+/i.test(line))continue;
      const m=line.match(/^(?:(let|const|var)\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/);
      if(m){if(builtins.has(m[2])||sampleVars.includes(m[2]))throw new Error(`${label}: ${m[2]} は予約名です`);declared.add(m[2]);declarations.push([m[2],m[3]])}
      else expressions.push(line);
    }
    if(!expressions.length&&!declarations.length)throw new Error(`${label}: 出力式がありません`);
    let output=expressions.at(-1);
    if(!output){
      const preferred=declarations.find(([name])=>name===preferredOutput);
      if(preferred)output=preferredOutput;
      else{const last=declarations.pop();declared.delete(last[0]);output=last[1]}
    }
    const allNames=new Set([...builtins,...sampleVars,...externalNames,...declared,"phasor","true","false","NaN","Infinity"]);
    const check=[...declarations.map(v=>v[1]),output].join("\n");
    for(const word of check.match(/\b[A-Za-z_][A-Za-z0-9_]*\b/g)||[]){if(!allNames.has(word)&&!/^e\d+$/i.test(word))throw new Error(`${label}: 未定義の名前「${word}」`)}
    const args=[...Object.keys(math),...externalNames,...sampleVars];
    const emitted=new Set();
    const declarationsJs=declarations.map(([name,expr])=>{const prefix=emitted.has(name)?"":"let ";emitted.add(name);return `${prefix}${name}=(${transformCaret(expr)});if(!Number.isFinite(${name}))${name}=0;`}).join("");
    let fn;
    const body=`"use strict";const phasor=a=>{const q=ph*a;return q-Math.floor(q)};${declarationsJs}const __v=(${transformCaret(output)});return Number.isFinite(__v)?__v:0;`;
    try{fn=Function(...args,body)}
    catch(e){throw new Error(`${label}: ${e.message}`)}
    const mathValues=Object.values(math);
    return {
      bind(params){return fn.bind(null,...mathValues,...externalNames.map(name=>params[name]??0))},
      program:{args,body,externalNames}
    };
  }
  function scanParams(){
    const found=new Map();
    for(const raw of ($("formulaX").value+"\n"+$("formulaY").value).split(/\r?\n/)){const def=parseParam(stripComment(raw));if(def&&!found.has(def.name))found.set(def.name,def)}
    const old=new Map(paramDefs.map(d=>[d.name,d.value]));
    paramDefs=[...found.values()].map(d=>({...d,value:old.has(d.name)?old.get(d.name):d.value}));
    renderParams();
  }
  function paramValues(){return Object.fromEntries(paramDefs.map(d=>[d.name,d.value]))}
  function renderParams(){
    const box=$("params");box.innerHTML="";$("emptyParams").hidden=paramDefs.length>0;
    for(const def of paramDefs){
      const row=document.createElement("div");row.className="param-row";
      row.innerHTML=`<label><span>${def.name}</span><output class="param-value">${def.value.toFixed(3)}</output></label><input type="range" min="${def.min}" max="${def.max}" step="${Math.max((def.max-def.min)/1000,0.0001)}" value="${def.value}" aria-label="${def.name}">`;
      const input=row.querySelector("input"),out=row.querySelector("output");
      input.oninput=()=>{def.value=+input.value;out.textContent=def.value.toFixed(3);syncAudioParams();save()};
      box.appendChild(row);
    }
  }
  function compile(){
    try{
      scanParams();const names=paramDefs.map(d=>d.name);
      compiled.x=compileFormula($("formulaX").value,"X",names,"out1");
      compiled.y=compileFormula($("formulaY").value,"Y",names,"out2");
      syncAudioProgram();
      $("compileInfo").textContent=`X / Y ともに正常 · ${names.length} param`;status("式を適用しました");save();
    }catch(e){$("compileInfo").textContent=e.message;status("式にエラーがあります",false)}
  }
  function scopeAt(t,evalX,evalY,step=currentStep,sr=48000,gate=held.size?1:0,result=null,frequency=null){
    const freq=frequency??noteFreq(step),ph=((t*freq)%1+1)%1,n=Math.floor(t*sr);
    let x=0,y=0;try{x=evalX?evalX(t,ph,n,sr,freq,step,gate,1,0,0,1,0):0;y=evalY?evalY(t,ph,n,sr,freq,step,gate,1,x,0,1,0):0}catch{}
    if(result){result[0]=x;result[1]=y;result[2]=freq;return result}
    return{x,y,freq};
  }
  function parseTuning(){
    try{
      const lines=$("tuning").value.split(/\r?\n/).map(stripComment).filter(Boolean);
      if(!lines.length)throw new Error("音律データが空です");
      const ratio=s=>{if(s.includes("/")){const[p,q]=s.split("/").map(Number);if(!(p>0)||!(q>0))throw new Error(`不正な比率: ${s}`);return p/q}const c=Number(s);if(!Number.isFinite(c))throw new Error(`不正なセント値: ${s}`);return 2**(c/1200)};
      const ratios=lines.map(ratio),period=ratios.at(-1),body=ratios.slice(0,-1),degrees=[];
      if(!body.length||Math.abs(body[0]-1)>1e-9)degrees.push(1);
      for(const r of body)if(Math.abs(r-1)>1e-9)degrees.push(r);
      scale={degrees,period};retuneHeld();$("tuningBadge").textContent=`${degrees.length}音 / ${period.toFixed(3)}:1`;status("音律を解析しました");save();
    }catch(e){status(e.message,false)}
  }
  function noteFreq(step){
    const L=scale.degrees.length,idx=((step%L)+L)%L,oct=Math.floor((step-idx)/L),base=Math.max(1,+$("baseHz").value||440);
    return Math.min(20000,base*scale.degrees[idx]*scale.period**oct);
  }
  function retuneHeld(){if(audioNode)for(const [key,step] of held)audioNode.port.postMessage({type:"noteOn",key,step,freq:noteFreq(step)})}
  function noteOn(key,step){
    held.set(key,step);currentStep=step;updateNoteMonitor();
    if(audioNode)audioNode.port.postMessage({type:"noteOn",key,step,freq:noteFreq(step)});
    document.querySelectorAll(`.key[data-key="${CSS.escape(key.toLowerCase())}"]`).forEach(el=>el.classList.add("active"));
  }
  function noteOff(key){
    held.delete(key);const rest=[...held.values()];if(rest.length)currentStep=rest.at(-1);updateNoteMonitor();
    if(audioNode)audioNode.port.postMessage({type:"noteOff",key});
    document.querySelectorAll(`.key[data-key="${CSS.escape(key.toLowerCase())}"]`).forEach(el=>el.classList.remove("active"));
  }
  function updateNoteMonitor(){
    const f=noteFreq(currentStep);$("noteName").textContent=held.size?`STEP ${currentStep>=0?"+":""}${currentStep}`:"—";$("frequency").textContent=`${f.toFixed(2)} Hz`;
  }
  function buildKeyboard(){
    const el=$("keyboard");
    for(const key of displayKeys){
      const b=document.createElement("button");b.className="key";b.type="button";b.dataset.key=key;
      b.innerHTML=`${key.toUpperCase()}<span>${keyMap[key]>=0?"+":""}${keyMap[key]}</span>`;
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);noteOn(key,keyMap[key])};
      b.onpointerup=b.onpointercancel=()=>noteOff(key);el.appendChild(b);
    }
  }
  function isEditing(){const el=document.activeElement;return el&&(el.tagName==="TEXTAREA"||el.tagName==="INPUT"||el.tagName==="SELECT")}
  function fitCanvas(canvas){
    const dpr=Math.min(devicePixelRatio||1,2),r=canvas.getBoundingClientRect(),w=Math.max(2,Math.round(r.width*dpr)),h=Math.max(2,Math.round(r.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
    return{ctx:canvas.getContext("2d"),w,h};
  }
  function grid(ctx,w,h,clear=true){
    if(clear)ctx.clearRect(0,0,w,h);ctx.strokeStyle="#203226";ctx.lineWidth=1;ctx.beginPath();
    for(let i=0;i<=10;i++){const x=i*w/10;ctx.moveTo(x,0);ctx.lineTo(x,h)}
    for(let i=0;i<=8;i++){const y=i*h/8;ctx.moveTo(0,y);ctx.lineTo(w,y)}
    ctx.stroke();ctx.strokeStyle="#34523c";ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,h);ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();
  }
  function trace(ctx,points,color,w,h,xy=false){
    ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=8;ctx.lineWidth=Math.max(1.2,w/900);ctx.beginPath();
    points.forEach((p,i)=>{const px=xy?(p.x*.46+.5)*w:p.x*w,py=(.5-p.y*.46)*h;if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py)});
    ctx.stroke();ctx.shadowBlur=0;
  }
  function makeVisualEffectProcessor(fx,sr){
    const type=fx.filterType,cut=Math.max(20,Math.min(sr*.45,fx.cutoff)),q=Math.max(.1,fx.resonance),w=2*Math.PI*cut/sr,alpha=Math.sin(w)/(2*q),c=Math.cos(w);
    let b0=1,b1=0,b2=0,a0=1,a1=0,a2=0;
    if(type==="lowpass"){b0=(1-c)/2;b1=1-c;b2=(1-c)/2;a0=1+alpha;a1=-2*c;a2=1-alpha}
    else if(type==="highpass"){b0=(1+c)/2;b1=-(1+c);b2=(1+c)/2;a0=1+alpha;a1=-2*c;a2=1-alpha}
    else if(type==="bandpass"){b0=alpha;b1=0;b2=-alpha;a0=1+alpha;a1=-2*c;a2=1-alpha}
    b0/=a0;b1/=a0;b2/=a0;a1/=a0;a2/=a0;
    let x1=0,x2=0,y1=0,y2=0;const phaseX=new Float64Array(4),phaseY=new Float64Array(4);
    return (input,t)=>{
      let x=Math.max(-4,Math.min(4,input*.42)),amount=fx.foldAmount;
      if(amount>0){const limit=Math.max(.05,fx.foldThreshold),drive=1+amount*6,mix=amount*.82,folded=limit*Math.sin(x/limit*drive)/(1+amount*.35);x+=(folded-x)*mix}
      const drive=1+fx.overdrive*24;if(drive>1)x=Math.tanh(x*drive)/Math.tanh(drive);
      if(fx.phaserMix>0){const f=Math.min(sr*.4,280+1500*(.5+.5*Math.sin(TAU*fx.phaserRate*t))),g=(1-Math.tan(Math.PI*f/sr))/(1+Math.tan(Math.PI*f/sr));let wet=x;for(let i=0;i<4;i++){const y=-g*wet+phaseX[i]+g*phaseY[i];phaseX[i]=wet;phaseY[i]=y;wet=y}x+=(wet-x)*fx.phaserMix}
      if(type!=="off"){const y=b0*x+b1*x1+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;x=y}
      return x/.42;
    };
  }
  function applyVisualEffects(points,sr,passes=1){
    const fx=effectState(),bypassed=fx.filterType==="off"&&fx.phaserMix===0&&fx.overdrive===0&&fx.foldAmount===0;
    if(bypassed)return points;
    const processX=makeVisualEffectProcessor(fx,sr),processY=makeVisualEffectProcessor(fx,sr);let result=points;
    for(let pass=0;pass<passes;pass++)result=points.map(p=>({x:processX(p.x,p.t),y:processY(p.y,p.t),t:p.t}));
    return result;
  }
  function draw(nowMs){
    const now=running?nowMs/1000-startTime:frozenTime,windowSec=+$("timeDiv").value*10,xGain=+$("xGain").value,yGain=+$("yGain").value,N=720,timePoints=[],xyPoints=[];
    const params=paramValues(),evalX=compiled.x?.bind(params),evalY=compiled.y?.bind(params);
    for(let i=0;i<N;i++){const t=now-windowSec+i*windowSec/(N-1),v=scopeAt(t,evalX,evalY);timePoints.push({x:v.x,y:v.y,t})}
    const cycleSec=1/noteFreq(currentStep);
    for(let i=0;i<N;i++){const t=now+i*cycleSec/(N-1),v=scopeAt(t,evalX,evalY);xyPoints.push({x:v.x,y:v.y,t})}
    const effectedTime=applyVisualEffects(timePoints,(N-1)/windowSec),effectedXY=applyVisualEffects(xyPoints,(N-1)/cycleSec,2);
    const tc=fitCanvas($("timeCanvas"));grid(tc.ctx,tc.w,tc.h);
    trace(tc.ctx,effectedTime.map((p,i)=>({x:i/(N-1),y:p.x*xGain*.82})),"#ffb452",tc.w,tc.h);
    trace(tc.ctx,effectedTime.map((p,i)=>({x:i/(N-1),y:p.y*yGain*.82})),"#9cffb6",tc.w,tc.h);
    const xc=fitCanvas($("xyCanvas")),fade=1-+$("persistence").value;
    const shownXY=effectedXY.map(p=>({x:p.x*xGain,y:p.y*yGain,t:p.t}));
    xc.ctx.fillStyle=`rgba(8,13,9,${Math.max(.035,fade)})`;xc.ctx.fillRect(0,0,xc.w,xc.h);xc.ctx.save();xc.ctx.globalAlpha=.24;grid(xc.ctx,xc.w,xc.h,false);xc.ctx.restore();trace(xc.ctx,shownXY,"#9cffb6",xc.w,xc.h,true);
    const last=effectedTime.at(-1);$("xReadout").textContent=last.x.toFixed(3);$("yReadout").textContent=last.y.toFixed(3);
    requestAnimationFrame(draw);
  }
  function syncAudioProgram(){if(audioNode&&compiled.x&&compiled.y)audioNode.port.postMessage({type:"program",x:compiled.x.program,y:compiled.y.program,params:paramValues()})}
  function syncAudioParams(){if(audioNode)audioNode.port.postMessage({type:"params",params:paramValues()})}
  function syncAudioVolume(){if(audioNode)audioNode.port.postMessage({type:"volume",value:+$("audioVolume").value})}
  const effectIds=["filterType","filterMaxHz","filterCutoff","filterResonance","phaserMix","phaserRate","overdrive","foldAmount","foldThreshold"];
  function cutoffHz(){const max=Math.max(100,Math.min(384000,+$("filterMaxHz").value||20000));return 20*Math.pow(max/20,+$("filterCutoff").value)}
  function effectState(){return {filterType:$("filterType").value,cutoff:cutoffHz(),resonance:+$("filterResonance").value,phaserMix:+$("phaserMix").value,phaserRate:+$("phaserRate").value,overdrive:+$("overdrive").value,foldAmount:+$("foldAmount").value,foldThreshold:+$("foldThreshold").value}}
  function syncEffects(){if(audioNode)audioNode.port.postMessage({type:"effects",value:effectState()})}
  function updateEffectReadouts(){
    $("filterCutoffOut").textContent=`${Math.round(cutoffHz())} Hz`;
    $("filterResonanceOut").textContent=`${(+$("filterResonance").value).toFixed(2)} Q`;
    $("phaserMixOut").textContent=`${Math.round(+$("phaserMix").value*100)}%`;
    $("phaserRateOut").textContent=`${(+$("phaserRate").value).toFixed(2)} Hz`;
    $("overdriveOut").textContent=`${Math.round(+$("overdrive").value*100)}%`;
    $("foldAmountOut").textContent=`${Math.round(+$("foldAmount").value*100)}%`;
    $("foldThresholdOut").textContent=(+$("foldThreshold").value).toFixed(2);
  }
  function bindEffects(){
    for(const id of effectIds){const el=$(id),update=()=>{updateEffectReadouts();syncEffects();save()},commit=()=>{if(id==="filterMaxHz")el.value=Math.max(100,Math.min(384000,+el.value||20000));update()};el.addEventListener("input",update);el.addEventListener("change",commit)}
    $("resetEffects").onclick=()=>{const defaults={filterType:"off",filterMaxHz:20000,filterCutoff:.8,filterResonance:.71,phaserMix:0,phaserRate:.3,overdrive:0,foldAmount:0,foldThreshold:1};for(const [id,value] of Object.entries(defaults))$(id).value=value;updateEffectReadouts();syncEffects();save();status("エフェクターをリセットしました")};
    updateEffectReadouts();
  }
  async function toggleAudio(){
    if(audioCtx){audioNode?.port.postMessage({type:"panic"});audioNode?.disconnect();await audioCtx.close();audioCtx=audioNode=null;if(workletUrl){URL.revokeObjectURL(workletUrl);workletUrl=null}$("audioButton").textContent="音声を開始";status("音声を停止しました");return}
    try{
      const Context=window.AudioContext||window.webkitAudioContext;audioCtx=new Context();
      workletUrl=URL.createObjectURL(new Blob([`(${shikeiWorkletModule.toString()})()`],{type:"text/javascript"}));
      await audioCtx.audioWorklet.addModule(workletUrl);
      audioNode=new AudioWorkletNode(audioCtx,"shikei-processor",{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],channelCount:2,channelCountMode:"explicit"});
      audioNode.connect(audioCtx.destination);syncAudioProgram();syncAudioVolume();syncEffects();
      for(const [key,step] of held)audioNode.port.postMessage({type:"noteOn",key,step,freq:noteFreq(step)});
      $("audioButton").textContent="音声を停止";status("音声が有効です — 鍵盤を押してください");
    }catch(e){audioNode?.disconnect();if(audioCtx)await audioCtx.close();audioCtx=audioNode=null;if(workletUrl){URL.revokeObjectURL(workletUrl);workletUrl=null}status(`音声を開始できません: ${e.message}`,false)}
  }
  function bindRanges(){
    for(const id of ["xGain","yGain","persistence","audioVolume"]){
      const input=$(id),out=input.nextElementSibling,percent=id==="persistence"||id==="audioVolume",update=()=>out.textContent=percent?`${Math.round(+input.value*100)}%`:`${(+input.value).toFixed(2)}×`;
      input.oninput=()=>{update();if(id==="audioVolume")syncAudioVolume();save()};update();
    }
    const updateTime=()=>{$("timeReadout").textContent=`${+$("timeDiv").value*1000} ms/div`};
    $("timeDiv").onchange=()=>{updateTime();save()};updateTime();
  }
  function save(){
    try{localStorage.setItem("shikei_formula_scope_v1",JSON.stringify({x:$("formulaX").value,y:$("formulaY").value,tuning:$("tuning").value,baseHz:$("baseHz").value,timeDiv:$("timeDiv").value,xGain:$("xGain").value,yGain:$("yGain").value,persistence:$("persistence").value,audioVolume:$("audioVolume").value,caretPower:$("caretPower").checked,params:paramValues(),effects:Object.fromEntries(effectIds.map(id=>[id,$(id).value]))}))}catch{}
  }
  function restore(){
    try{
      const s=JSON.parse(localStorage.getItem("shikei_formula_scope_v1"));if(!s)return;
      for(const [key,id] of [["x","formulaX"],["y","formulaY"],["tuning","tuning"],["baseHz","baseHz"],["timeDiv","timeDiv"],["xGain","xGain"],["yGain","yGain"],["persistence","persistence"],["audioVolume","audioVolume"]])if(s[key]!=null)$(id).value=s[key];
      for(const id of effectIds)if(s.effects?.[id]!=null)$(id).value=s.effects[id];
      if(s.caretPower!=null)$("caretPower").checked=s.caretPower;scanParams();
      for(const d of paramDefs)if(Number.isFinite(s.params?.[d.name]))d.value=s.params[d.name];renderParams();
    }catch{}
  }

  $("compileButton").onclick=compile;$("parseTuning").onclick=parseTuning;$("audioButton").onclick=toggleAudio;
  $("runButton").onclick=()=>{running=!running;if(running){startTime=performance.now()/1000-frozenTime;$("runButton").textContent="一時停止"}else{frozenTime=performance.now()/1000-startTime;$("runButton").textContent="再開"}};
  $("loadPreset").onclick=()=>{const p=presets[$("preset").value];$("formulaX").value=p.x;$("formulaY").value=p.y;compile()};
  $("caretPower").onchange=compile;$("baseHz").onchange=()=>{retuneHeld();updateNoteMonitor();save()};
  for(const tab of document.querySelectorAll(".scope-tab"))tab.onclick=()=>{document.querySelectorAll(".scope-tab").forEach(t=>t.classList.remove("active"));tab.classList.add("active");document.querySelector(".screens").dataset.view=tab.dataset.view};
  window.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();compile();return}if(e.repeat||isEditing())return;const step=keyMap[e.key.toLowerCase()];if(step==null)return;e.preventDefault();noteOn(e.key,step)});
  window.addEventListener("keyup",e=>noteOff(e.key));window.addEventListener("blur",()=>{for(const key of [...held.keys()])noteOff(key)});window.addEventListener("beforeunload",save);

  restore();buildKeyboard();parseTuning();compile();bindRanges();bindEffects();updateNoteMonitor();requestAnimationFrame(draw);
})();
