// scaleword.js - 音程間隔（step）の抽出と音階語生成

window.JI_SCALEWORD = {
    generateScaleWord: function(sortedList, toleranceCents, autoCloseOctave) {
        if(sortedList.length === 0) return null;

        let list = [...sortedList];
        
        // Ensure starting at 1/1 (0 cents)
        if(list[0].normalizedCents > 0.1) {
            let pseudoUnison = window.JI_PARSER.createIntervalObj(1, 1, [0], "1/1");
            list.unshift(pseudoUnison);
        }

        // Auto close octave logic
        if(autoCloseOctave) {
            let hasOctave = list.some(item => Math.abs(item.normalizedCents - 1200) < 0.1 || Math.abs(item.normalizedRatioValue - 2) < 0.001);
            if(!hasOctave) {
                let pseudoOct = window.JI_PARSER.createIntervalObj(2, 1, [1], "2/1");
                pseudoOct.normalizedCents = 1200; 
                pseudoOct.normalizedRatioValue = 2;
                list.push(pseudoOct);
            }
        }
        
        let steps = [];
        for(let i=0; i<list.length-1; i++) {
            let cDiff = list[i+1].normalizedCents - list[i].normalizedCents;
            if(cDiff < -0.1) cDiff += 1200; // wrap around fallback
            
            let rNum = list[i+1].normalizedNumerator * list[i].normalizedDenominator;
            let rDen = list[i+1].normalizedDenominator * list[i].normalizedNumerator;
            
            let gcd = function(a, b) { return b ? gcd(b, a%b) : a; };
            let g = gcd(rNum, rDen);
            rNum /= g; rDen /= g;
            
            steps.push({
                cents: cDiff,
                ratioText: `${rNum}/${rDen}`
            });
        }
        
        // Group by tolerance
        let groups = [];
        for(let st of steps) {
            let found = false;
            for(let g of groups) {
                if(Math.abs(g.cents - st.cents) <= toleranceCents) {
                    g.count++;
                    g.items.push(st);
                    found = true;
                    st.group = g;
                    break;
                }
            }
            if(!found) {
                let newG = {
                    id: groups.length,
                    cents: st.cents,
                    ratioText: st.ratioText,
                    count: 1,
                    items: [st]
                };
                groups.push(newG);
                st.group = newG;
            }
        }
        
        groups.sort((a,b) => b.cents - a.cents);
        
        let symbols = ["L", "M", "N", "O", "P", "Q", "R", "T", "U", "V", "W", "X", "Y", "Z"];
        for(let i=0; i<groups.length; i++) {
            if(i === groups.length - 1 && groups.length > 1) { 
                groups[i].symbol = "s"; // 最小ステップは 's' とする
            } else if(i < symbols.length) {
                groups[i].symbol = symbols[i];
            } else {
                groups[i].symbol = "?";
            }
        }
        
        let word = "";
        for(let st of steps) {
            word += st.group.symbol;
        }
        
        return {
            steps: steps,
            groups: groups,
            word: word
        };
    }
};
