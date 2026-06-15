/**
 * ImageLoader.js
 * Handles loading of images from File objects.
 */

export class ImageLoader {
    /**
     * Loads an image file and returns an ImageBitmap.
     * @param {File} file 
     * @returns {Promise<ImageBitmap>}
     */
    static async load(file) {
        if (!file) throw new Error('No file provided');

        // Ensure it's an image
        if (!file.type.startsWith('image/')) {
            throw new Error('File is not an image');
        }

        const img = await createImageBitmap(file);
        return img;
    }
}
