/**
 * HistoryManager.js
 * Handles Undo/Redo functionality using snapshots.
 */

import { Tiler } from './Tiler.js';

export class HistoryManager {
    constructor(maxSize = 50) {
        this.maxSize = maxSize;
        this.undoStack = [];
        this.redoStack = [];
    }

    /**
     * Pushes a new snapshot to the history.
     * Clears the redo stack.
     * @param {object} snapshot { tiles, influence, protect }
     * @param {number} tileSize Needed for deep cloning tiles
     */
    push(snapshot, tileSize) {
        // Deep clone the snapshot
        const entry = this._cloneSnapshot(snapshot, tileSize);

        this.undoStack.push(entry);
        if (this.undoStack.length > this.maxSize) {
            this.undoStack.shift();
        }
        this.redoStack = [];
        this._updateUI();
    }

    /**
     * Performs Undo.
     * @param {object} currentBytes Current state to push to redo (before reverting)
     * @param {number} tileSize
     * @returns {object|null} The snapshot to restore, or null if empty
     */
    undo(currentState, tileSize) {
        if (this.undoStack.length === 0) return null;

        const restoreState = this.undoStack.pop();

        // Push current state to redo
        const redoEntry = this._cloneSnapshot(currentState, tileSize);
        this.redoStack.push(redoEntry);

        this._updateUI();

        // Return a copy of the restored state so the stack's version isn't mutated
        return this._cloneSnapshot(restoreState, tileSize);
    }

    /**
     * Performs Redo.
     * @param {object} currentState Current state to push to undo (before reverting)
     * @param {number} tileSize
     * @returns {object|null}
     */
    redo(currentState, tileSize) {
        if (this.redoStack.length === 0) return null;

        const restoreState = this.redoStack.pop();

        // Push current state to undo
        const undoEntry = this._cloneSnapshot(currentState, tileSize);
        this.undoStack.push(undoEntry);

        this._updateUI();

        return this._cloneSnapshot(restoreState, tileSize);
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this._updateUI();
    }

    _cloneSnapshot(snapshot, tileSize) {
        return {
            tiles: Tiler.cloneTiles(snapshot.tiles, tileSize),
            influence: new Float32Array(snapshot.influence),
            protect: new Uint8Array(snapshot.protect)
        };
    }

    _updateUI() {
        const btnUndo = document.getElementById('btnUndo');
        const btnRedo = document.getElementById('btnRedo');
        if (btnUndo) btnUndo.disabled = this.undoStack.length === 0;
        if (btnRedo) btnRedo.disabled = this.redoStack.length === 0;
    }
}
