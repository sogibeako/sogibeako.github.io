// node ariadne-ai/train.cjs [generations=8] [seed=123] [output=ariadne-ai/training-result.json]
const fs=require('node:fs'),T=require('./training.js');
const generations=Number(process.argv[2]??8),seed=Number(process.argv[3]??123),output=process.argv[4]??'ariadne-ai/training-result.json';
const course=process.argv[5]||'small';
const model=process.argv[6]?T.validate(JSON.parse(fs.readFileSync(process.argv[6],'utf8'))):T.fresh();
T.train({generations,seed,course,model,onProgress:r=>console.log(JSON.stringify({generation:r.generation,trainingReward:r.reward,trainingClearRate:r.clearRate}))}).then(result=>{fs.writeFileSync(output,JSON.stringify(result,null,2));fs.writeFileSync(output.replace(/\.json$/i,'')+'-model.json',JSON.stringify(result.model,null,2));console.log(JSON.stringify({output,before:result.before?.clearRate,after:result.after?.clearRate,weights:result.model.weights}));}).catch(e=>{console.error(e.message);process.exitCode=1;});
