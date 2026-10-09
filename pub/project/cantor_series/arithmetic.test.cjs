const assert = require('node:assert/strict');
const C = require('./core.js');
const value = text => { const x=C.expression(text); assert.equal(x.exact,true,text); return C.format(x.value.p,x.value.d); };
for (const [text,expected] of [
  ['1+2*3','7'], ['(1+2)*3','9'], ['2^3^2','512'], ['-2^2','-4'],
  ['(-2)^2','4'], ['2^-3','1/8'], ['1/2/3','1/6'], ['2--3','5'],
  ['sqrt(1+3)','2'], ['(16/81)^(1-1/4)','8/27'], ['(-8)^(1/3)','-2'],
  ['(pi-pi)+2','2'], ['pi/pi','1'], ['0*pi','0'], ['phi^0','1'],
  ['1.25 × 2 ÷ 5','1/2'], ['1/(3-5)','-1/2']
]) assert.equal(value(text),expected,text);
for(let a=-10;a<=10;a++) for(let b=1;b<=9;b++) {
  assert.equal(value(`(${a}/7+${b}/3)*21`),String(3*a+7*b));
}
const e=C.expression('e'), pi=C.expression('pi'), phi=C.expression('phi'), S=e.scale;
const sub=C.expression('e-2');
assert.equal(sub.lower,e.lower-2n*S);
assert.equal(sub.upper,e.upper-2n*S);
const sum=C.expression('e+phi');
assert.ok(sum.lower<=e.lower+phi.lower && sum.upper>=e.upper+phi.upper);
const square=C.expression('pi^2');
assert.ok(square.lower*S<=pi.lower**2n && square.upper*S>=pi.upper**2n);
const reciprocal=C.expression('1/(e+1)');
assert.ok(reciprocal.lower*(e.upper+S)<=S*S);
assert.ok(reciprocal.upper*(e.lower+S)>=S*S);
const root=C.expression('pi^(1/2)');
assert.ok(root.lower**2n<=pi.lower*S && root.upper**2n>=pi.upper*S);
assert.equal(C.expression('2-e').negative,true);
assert.equal(C.expression('2-e').lower,sub.lower);
const negative=C.expression('(-pi)^(-1)');
assert.equal(negative.negative,true);
assert.ok(negative.lower*pi.upper<=S*S && negative.upper*pi.lower>=S*S);
const ten=C.sequence('constant','10');
const digits=C.expandExpression(square,ten,30);
assert.equal(digits.whole,9n);
assert.equal(digits.rows.map(r=>r.digit).join(''),'869604401089358618834490999876');
assert.equal(C.expandExpression(sub,ten,30).rows.map(r=>r.digit).join(''),'718281828459045235360287471352');
for(const text of ['1/0','1/(pi-pi)','0^0','0^-1','(-pi)^(1/2)','sqrt(-1)', '2^pi','pi^101','(e+1','e+','2pi','sin(pi)','1 2','Math.PI','2**3','']) {
  assert.throws(()=>C.expression(text),undefined,text);
}
// Do not pretend an uncertain cancellation is an exact integer.
assert.throws(()=>C.expandExpression(C.expression('phi^2-phi'),ten,24));
console.log('Passed: expression precedence, rational arithmetic, constants, interval bounds, powers, cancellation and invalid inputs.');
