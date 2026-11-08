/* Integer translation torus prototype; independent of rectangular maze storage. */
(function (root) {
  'use strict';
  function create({ width = 8, height = 8, shiftX = 2, shiftY = 2 } = {}) {
    if (![width, height].every(n => Number.isInteger(n) && n >= 8 && n <= 24 && n % 2 === 0) ||
        ![shiftX, shiftY].every(n => Number.isInteger(n) && n % 2 === 0) || Math.abs(shiftX) >= width || Math.abs(shiftY) >= height) {
      throw new Error('幅・高さは8〜24の偶数、ずれは対応する辺の長さ未満の偶数にしてください。');
    }
    const determinant = width * height - shiftX * shiftY;
    return { width, height, shiftX, shiftY, determinant, a: [width, -shiftY], b: [-shiftX, height] };
  }
  function canonical(w, x, y) {
    // Half-open parallelogram, offset by (-1/2,-1/2) to place integer cells
    // around the origin. Integer numerators make boundary ownership consistent.
    const a = Math.floor((w.height * (2*x+1) + w.shiftX * (2*y+1)) / (2*w.determinant));
    const b = Math.floor((w.shiftY * (2*x+1) + w.width * (2*y+1)) / (2*w.determinant));
    return { x: x-a*w.width+b*w.shiftX, y: y+a*w.shiftY-b*w.height, a, b };
  }
  function cells(w) {
    const corners = [[0,0],w.a,w.b,[w.a[0]+w.b[0],w.a[1]+w.b[1]]];
    const xs=corners.map(p=>p[0]-.5), ys=corners.map(p=>p[1]-.5), result=[];
    for(let y=Math.floor(Math.min(...ys));y<=Math.ceil(Math.max(...ys));y++)
      for(let x=Math.floor(Math.min(...xs));x<=Math.ceil(Math.max(...xs));x++) {
        const p=canonical(w,x,y); if(p.x===x && p.y===y) result.push({x,y});
      }
    return result;
  }
  const api={create,canonical,cells};
  if(typeof module!=='undefined' && module.exports) module.exports=api; else root.TorusLattice=api;
})(globalThis);
