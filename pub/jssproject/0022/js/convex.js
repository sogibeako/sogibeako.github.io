// convex.js - 凸領域判定および格子点抽出

window.JI_CONVEX = {
    extractLatticePoints: function(endpoints) {
        if(endpoints.length < 2) return { error: "端点が少なすぎます。" };
        let dim = endpoints[0].reducedMonzo.length;
        
        let minBounds = new Array(dim).fill(Infinity);
        let maxBounds = new Array(dim).fill(-Infinity);
        
        for(let ep of endpoints) {
            for(let i=0; i<dim; i++) {
                minBounds[i] = Math.min(minBounds[i], ep.reducedMonzo[i]);
                maxBounds[i] = Math.max(maxBounds[i], ep.reducedMonzo[i]);
            }
        }
        
        let totalVolume = 1;
        for(let i=0; i<dim; i++) {
            totalVolume *= (maxBounds[i] - minBounds[i] + 1);
        }
        
        if(totalVolume > 50000) {
             return { error: `計算量が大きすぎます (${totalVolume} 個の格子点)。範囲を狭めるか次元を減らしてください。` };
        }
        
        let extracted = [];
        let infoLogger = [];

        if(dim === 2) {
            let center = [0,0];
            endpoints.forEach(ep => { center[0]+=ep.reducedMonzo[0]; center[1]+=ep.reducedMonzo[1]; });
            center[0] /= endpoints.length; center[1] /= endpoints.length;
            
            // 角度順ソート (擬似的な凸包外周としての解釈)
            let sortedPts = [...endpoints].map(ep => ep.reducedMonzo).sort((a, b) => {
                 let angA = Math.atan2(a[1]-center[1], a[0]-center[0]);
                 let angB = Math.atan2(b[1]-center[1], b[0]-center[0]);
                 return angA - angB;
            });
            
            infoLogger.push("2D領域内の格子点を抽出します。");
            
            for(let x=minBounds[0]; x<=maxBounds[0]; x++) {
                for(let y=minBounds[1]; y<=maxBounds[1]; y++) {
                    if(this._pointInPolygon([x,y], sortedPts)) {
                        extracted.push([x,y]);
                    }
                }
            }
        } else {
             infoLogger.push("3D以上の厳密な凸包内部判定は現在Bounding Boxとして近似抽出します。");
             let coords = [];
             this._recursiveBoxGen(minBounds, maxBounds, 0, [], coords);
             extracted = coords;
        }
        
        return { points: extracted, info: infoLogger };
    },

    _recursiveBoxGen: function(mins, maxs, d, current, result) {
         if(d === mins.length) {
             result.push([...current]);
             return;
         }
         for(let v = mins[d]; v <= maxs[d]; v++) {
             current.push(v);
             this._recursiveBoxGen(mins, maxs, d+1, current, result);
             current.pop();
         }
    },

    _pointInPolygon: function(point, vs) {
        let x = point[0], y = point[1];
        let inside = false;
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
            let xi = vs[i][0], yi = vs[i][1];
            let xj = vs[j][0], yj = vs[j][1];
            
            let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        // 境界上の点
        for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
             let xi = vs[i][0], yi = vs[i][1];
             let xj = vs[j][0], yj = vs[j][1];
             let cross = (y - yi) * (xj - xi) - (x - xi) * (yj - yi);
             if(Math.abs(cross) === 0) { 
                 if(Math.min(xi,xj)<=x && x<=Math.max(xi,xj) && Math.min(yi,yj)<=y && y<=Math.max(yi,yj)) {
                     return true; 
                 }
             }
        }
        return inside;
    }
};
