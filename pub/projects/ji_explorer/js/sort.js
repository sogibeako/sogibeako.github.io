// sort.js

window.JI_SORT = {
    sortByRaw: function(intervalList) {
        return [...intervalList].sort((a,b) => a.ratioValue - b.ratioValue);
    },
    sortByNormalized: function(intervalList) {
        return [...intervalList].sort((a,b) => a.normalizedRatioValue - b.normalizedRatioValue);
    }
};
