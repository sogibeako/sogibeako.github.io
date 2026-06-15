/**
 * Region Manager for SpectroSampler
 * Manages named time regions for playback and retrigger
 */

export class RegionManager {
    constructor() {
        this.regions = [];
        this.selectedIndex = -1;
        this.onRegionsChange = null;

        // Default colors for new regions
        this._colorPalette = [
            'rgba(255, 100, 100, 0.2)',
            'rgba(100, 200, 255, 0.2)',
            'rgba(100, 255, 100, 0.2)',
            'rgba(255, 200, 50, 0.2)',
            'rgba(200, 100, 255, 0.2)',
            'rgba(255, 150, 50, 0.2)',
            'rgba(50, 255, 200, 0.2)',
            'rgba(255, 50, 200, 0.2)',
        ];
    }

    /**
     * Add a new region
     * @param {number} start - start time in seconds
     * @param {number} end - end time in seconds
     * @param {string} name - optional name
     * @returns {number} index of added region
     */
    addRegion(start, end, name) {
        if (end < start) [start, end] = [end, start];
        if (end - start < 0.001) return -1; // Too short

        const idx = this.regions.length;
        this.regions.push({
            start,
            end,
            name: name || `Region ${idx + 1}`,
            color: this._colorPalette[idx % this._colorPalette.length],
        });

        this.selectedIndex = idx;
        this._notifyChange();
        return idx;
    }

    removeRegion(index) {
        if (index < 0 || index >= this.regions.length) return;
        this.regions.splice(index, 1);
        if (this.selectedIndex >= this.regions.length) {
            this.selectedIndex = this.regions.length - 1;
        }
        this._notifyChange();
    }

    selectRegion(index) {
        this.selectedIndex = index;
        this._notifyChange();
    }

    getSelected() {
        if (this.selectedIndex < 0 || this.selectedIndex >= this.regions.length) return null;
        return this.regions[this.selectedIndex];
    }

    clear() {
        this.regions = [];
        this.selectedIndex = -1;
        this._notifyChange();
    }

    _notifyChange() {
        if (this.onRegionsChange) this.onRegionsChange(this.regions, this.selectedIndex);
    }
}
