// normalize.js - オクターブ正規化処理

window.JI_NORMALIZE = {
    normalizeRatio: function(num, den) {
        let r = num / den;
        let k = 0;
        let num_new = num;
        let den_new = den;
        
        while(r < 1 && r > 0) {
            r *= 2;
            k += 1;
            num_new *= 2;
        }
        while(r >= 2 && r > 0) {
            r /= 2;
            k -= 1;
            if(num_new % 2 === 0) {
                num_new /= 2;
            } else {
                den_new *= 2;
            }
        }
        return { num: num_new, den: den_new, k: k, ratioValue: r };
    },

    normalizeMonzo: function(monzo) {
        let ratioRes = window.JI_MONZO.monzoToRatio(monzo);
        let normRes = this.normalizeRatio(ratioRes.num, ratioRes.den);
        
        let newMonzo = [...monzo];
        newMonzo[0] += normRes.k;
        
        return { monzo: newMonzo, k: normRes.k };
    }
};
