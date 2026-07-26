(function (root) {
  "use strict";

  const WIDTH = 256;
  const HEIGHT = 240;
  const MASTER_HEX = [
    "626262","001fb2","2404c8","5200b2","730076","800024","730b00","522800",
    "244400","005700","005c00","005324","003c76","000000","000000","000000",
    "ababab","0d57ff","4b30ff","8a13ff","bc08d6","d21269","c72e00","9d5400",
    "607b00","209800","00a300","009942","0087a3","000000","000000","000000",
    "ffffff","53aeff","9085ff","d365ff","ff57ff","ff5dcf","ff7757","fa9e00",
    "bdc700","7ae700","43f611","26f07e","2cd6e6","4a4a4a","000000","000000",
    "ffffff","b6e1ff","ced1ff","e9c3ff","ffbcff","ffbdf4","ffc6c3","ffd59a",
    "e9e681","cef481","b6f5a9","aef3d0","b5ebf2","b8b8b8","000000","000000"
  ];
  const MASTER_RGB = MASTER_HEX.map((hex) => ({
    r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16)
  }));
  const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  function colorDistance(a, b) {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
  }

  function nearestMaster(r, g, b) {
    const color = { r, g, b };
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < 64; i += 1) {
      if (i === 0x0d) continue;
      const distance = colorDistance(color, MASTER_RGB[i]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  }

  function nearestFromPalette(colorIndex, palette) {
    let bestSlot = 0;
    let bestDistance = Infinity;
    for (let slot = 0; slot < palette.length; slot += 1) {
      const distance = colorDistance(MASTER_RGB[colorIndex], MASTER_RGB[palette[slot]]);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestSlot = slot;
      }
    }
    return bestSlot;
  }

  function topHistogramColors(histogram, excluded, count) {
    return Array.from(histogram.entries())
      .filter(([index]) => !excluded.has(index))
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([index]) => index);
  }

  function paletteCost(histogram, palette) {
    let cost = 0;
    histogram.forEach((weight, index) => {
      cost += weight * colorDistance(MASTER_RGB[index], MASTER_RGB[palette[nearestFromPalette(index, palette)]]);
    });
    return cost;
  }

  function greedyPalette(histogram, fixedColor, colorCount) {
    const palette = fixedColor === null ? [] : [fixedColor];
    const candidates = Array.from(histogram.keys()).filter((index) => index !== fixedColor);
    while (palette.length < colorCount) {
      let best = candidates.find((index) => !palette.includes(index));
      let bestCost = Infinity;
      candidates.forEach((candidate) => {
        if (palette.includes(candidate)) return;
        const cost = paletteCost(histogram, palette.concat(candidate));
        if (cost < bestCost) {
          bestCost = cost;
          best = candidate;
        }
      });
      if (best === undefined) best = palette.length ? palette[palette.length - 1] : 0x0f;
      palette.push(best);
    }
    return palette;
  }

  function histogramDistance(a, palette) {
    return paletteCost(a.hist, palette) / Math.max(1, a.weight);
  }

  function clusterHistograms(items, fixedColor, groupCount, colorCount) {
    const fallback = fixedColor === null ? 0x0f : fixedColor;
    if (!items.length) return {
      palettes: Array.from({ length: groupCount }, () => Array.from({ length: colorCount }, () => fallback)),
      assignments: new Uint8Array(0)
    };
    const sorted = items.slice().sort((a, b) => b.weight - a.weight);
    let groups = [greedyPalette(sorted[0].hist, fixedColor, colorCount)];
    while (groups.length < groupCount) {
      let bestItem = sorted[0];
      let bestDistance = -1;
      sorted.forEach((item) => {
        const distance = Math.min(...groups.map((palette) => histogramDistance(item, palette)));
        if (distance > bestDistance) {
          bestDistance = distance;
          bestItem = item;
        }
      });
      groups.push(greedyPalette(bestItem.hist, fixedColor, colorCount));
    }

    let assignments = new Uint8Array(items.length);
    for (let iteration = 0; iteration < 5; iteration += 1) {
      items.forEach((item, index) => {
        let bestGroup = 0;
        let bestCost = Infinity;
        groups.forEach((palette, groupIndex) => {
          const cost = paletteCost(item.hist, palette);
          if (cost < bestCost) {
            bestCost = cost;
            bestGroup = groupIndex;
          }
        });
        assignments[index] = bestGroup;
      });
      groups = groups.map((palette, groupIndex) => {
        const merged = new Map();
        items.forEach((item, index) => {
          if (assignments[index] !== groupIndex) return;
          item.hist.forEach((weight, color) => merged.set(color, (merged.get(color) || 0) + weight));
        });
        return merged.size ? greedyPalette(merged, fixedColor, colorCount) : palette;
      });
    }
    return { palettes: groups, assignments };
  }

  function imageToMasterIndices(rgba, options) {
    const indices = new Uint8Array(WIDTH * HEIGHT);
    const alpha = new Uint8Array(WIDTH * HEIGHT);
    const strength = options.dither === "ordered" ? (options.ditherStrength || 0) : 0;
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const pixel = y * WIDTH + x;
        const offset = pixel * 4;
        alpha[pixel] = rgba[offset + 3];
        const adjustment = strength * ((BAYER4[(y & 3) * 4 + (x & 3)] - 7.5) / 7.5);
        indices[pixel] = nearestMaster(
          Math.max(0, Math.min(255, rgba[offset] + adjustment)),
          Math.max(0, Math.min(255, rgba[offset + 1] + adjustment)),
          Math.max(0, Math.min(255, rgba[offset + 2] + adjustment))
        );
      }
    }
    return { indices, alpha };
  }

  function quantizeBackground(rgba, options = {}) {
    const converted = imageToMasterIndices(rgba, options);
    const globalHistogram = new Map();
    converted.indices.forEach((index, pixel) => {
      if (converted.alpha[pixel] > 16) globalHistogram.set(index, (globalHistogram.get(index) || 0) + 1);
    });
    const universal = topHistogramColors(globalHistogram, new Set(), 1)[0] ?? 0x0f;
    const blocks = [];
    for (let by = 0; by < 15; by += 1) {
      for (let bx = 0; bx < 16; bx += 1) {
        const hist = new Map();
        let weight = 0;
        for (let y = by * 16; y < by * 16 + 16; y += 1) {
          for (let x = bx * 16; x < bx * 16 + 16; x += 1) {
            const pixel = y * WIDTH + x;
            const index = converted.alpha[pixel] > 16 ? converted.indices[pixel] : universal;
            hist.set(index, (hist.get(index) || 0) + 1);
            weight += 1;
          }
        }
        blocks.push({ hist, weight });
      }
    }
    const clustered = clusterHistograms(blocks, universal, 4, 4);
    const pixelSlots = new Uint8Array(WIDTH * HEIGHT);
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const pixel = y * WIDTH + x;
        const block = (y >> 4) * 16 + (x >> 4);
        const colorIndex = converted.alpha[pixel] > 16 ? converted.indices[pixel] : universal;
        pixelSlots[pixel] = nearestFromPalette(colorIndex, clustered.palettes[clustered.assignments[block]]);
      }
    }
    return {
      palettes: clustered.palettes,
      blockPalettes: clustered.assignments,
      pixelSlots,
      universal
    };
  }

  function reduceToNesColors(rgba, maxColors) {
    const converted = imageToMasterIndices(rgba, { dither: "none", ditherStrength: 0 });
    const histogram = new Map();
    converted.indices.forEach((index, pixel) => {
      if (converted.alpha[pixel] > 16) histogram.set(index, (histogram.get(index) || 0) + 1);
    });
    if (!histogram.size) {
      return { rgba: new Uint8ClampedArray(rgba), palette: [], beforeCount: 0, afterCount: 0 };
    }
    const requested = Math.max(1, Math.min(32, Math.floor(maxColors || 13)));
    const colorCount = Math.min(requested, histogram.size);
    const palette = greedyPalette(histogram, null, colorCount);
    const output = new Uint8ClampedArray(rgba);
    converted.indices.forEach((index, pixel) => {
      if (converted.alpha[pixel] <= 16) return;
      const rgb = MASTER_RGB[palette[nearestFromPalette(index, palette)]];
      const offset = pixel * 4;
      output[offset] = rgb.r;
      output[offset + 1] = rgb.g;
      output[offset + 2] = rgb.b;
    });
    return { rgba: output, palette, beforeCount: histogram.size, afterCount: palette.length };
  }

  function enhanceEdges(rgba, strength) {
    const source = new Uint8ClampedArray(rgba);
    const output = new Uint8ClampedArray(rgba);
    const amount = Math.max(0, Math.min(100, Number(strength) || 0)) / 100 * 1.8;
    const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
    let changedPixels = 0;
    let edgePixels = 0;
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const pixel = y * WIDTH + x;
        const offset = pixel * 4;
        if (source[offset + 3] <= 16) continue;
        let red = 0;
        let green = 0;
        let blue = 0;
        let totalWeight = 0;
        let kernelIndex = 0;
        for (let ky = -1; ky <= 1; ky += 1) {
          for (let kx = -1; kx <= 1; kx += 1) {
            const nx = Math.max(0, Math.min(WIDTH - 1, x + kx));
            const ny = Math.max(0, Math.min(HEIGHT - 1, y + ky));
            const neighbor = (ny * WIDTH + nx) * 4;
            const weight = kernel[kernelIndex++];
            if (source[neighbor + 3] <= 16) continue;
            red += source[neighbor] * weight;
            green += source[neighbor + 1] * weight;
            blue += source[neighbor + 2] * weight;
            totalWeight += weight;
          }
        }
        if (!totalWeight) continue;
        const blurRed = red / totalWeight;
        const blurGreen = green / totalWeight;
        const blurBlue = blue / totalWeight;
        const diffRed = source[offset] - blurRed;
        const diffGreen = source[offset + 1] - blurGreen;
        const diffBlue = source[offset + 2] - blurBlue;
        const luminanceDifference = Math.abs(diffRed * 0.299 + diffGreen * 0.587 + diffBlue * 0.114);
        const channelDifference = Math.max(Math.abs(diffRed), Math.abs(diffGreen), Math.abs(diffBlue));
        const edge = Math.max(luminanceDifference, channelDifference * 0.45);
        if (edge < 4) continue;
        edgePixels += 1;
        const edgeScale = amount * Math.min(1, 0.25 + (edge - 4) / 20);
        const nextRed = Math.max(0, Math.min(255, Math.round(source[offset] + diffRed * edgeScale)));
        const nextGreen = Math.max(0, Math.min(255, Math.round(source[offset + 1] + diffGreen * edgeScale)));
        const nextBlue = Math.max(0, Math.min(255, Math.round(source[offset + 2] + diffBlue * edgeScale)));
        if (nextRed !== source[offset] || nextGreen !== source[offset + 1] || nextBlue !== source[offset + 2]) changedPixels += 1;
        output[offset] = nextRed;
        output[offset + 1] = nextGreen;
        output[offset + 2] = nextBlue;
      }
    }
    return { rgba: output, changedPixels, edgePixels, strength: Math.round(amount / 1.8 * 100) };
  }

  function encodeTile(slots) {
    const bytes = new Uint8Array(16);
    for (let y = 0; y < 8; y += 1) {
      let low = 0;
      let high = 0;
      for (let x = 0; x < 8; x += 1) {
        const value = slots[y * 8 + x] & 3;
        low |= (value & 1) << (7 - x);
        high |= ((value >> 1) & 1) << (7 - x);
      }
      bytes[y] = low;
      bytes[y + 8] = high;
    }
    return bytes;
  }

  function buildBackgroundTiles(pixelSlots, blockPalettes) {
    const tileKeys = [];
    const counts = new Map();
    for (let ty = 0; ty < 30; ty += 1) {
      for (let tx = 0; tx < 32; tx += 1) {
        let key = "";
        for (let y = 0; y < 8; y += 1) {
          for (let x = 0; x < 8; x += 1) key += pixelSlots[(ty * 8 + y) * WIDTH + tx * 8 + x];
        }
        tileKeys.push(key);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    const sortedKeys = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).map(([key]) => key);
    const keptKeys = sortedKeys.slice(0, 256);
    const indexByKey = new Map(keptKeys.map((key, index) => [key, index]));
    const approximate = new Map();
    function closestKey(source) {
      if (approximate.has(source)) return approximate.get(source);
      let bestIndex = 0;
      let bestDifference = Infinity;
      keptKeys.forEach((candidate, candidateIndex) => {
        let difference = 0;
        for (let i = 0; i < 64; i += 1) if (source[i] !== candidate[i]) difference += 1;
        if (difference < bestDifference) {
          bestDifference = difference;
          bestIndex = candidateIndex;
        }
      });
      approximate.set(source, bestIndex);
      return bestIndex;
    }
    const nametable = new Uint8Array(1024);
    tileKeys.forEach((key, index) => {
      nametable[index] = indexByKey.has(key) ? indexByKey.get(key) : closestKey(key);
    });
    for (let ay = 0; ay < 8; ay += 1) {
      for (let ax = 0; ax < 8; ax += 1) {
        const bx = ax * 2;
        const by = ay * 2;
        const tl = blockPalettes[by * 16 + bx] || 0;
        const tr = blockPalettes[by * 16 + bx + 1] || 0;
        const bl = by + 1 < 15 ? blockPalettes[(by + 1) * 16 + bx] || 0 : 0;
        const br = by + 1 < 15 ? blockPalettes[(by + 1) * 16 + bx + 1] || 0 : 0;
        nametable[960 + ay * 8 + ax] = tl | (tr << 2) | (bl << 4) | (br << 6);
      }
    }
    const chr = new Uint8Array(4096);
    keptKeys.forEach((key, index) => {
      const slots = Uint8Array.from(key, Number);
      chr.set(encodeTile(slots), index * 16);
    });
    return {
      chr,
      nametable,
      uniqueCount: sortedKeys.length,
      storedCount: keptKeys.length,
      approximatedCount: Math.max(0, sortedKeys.length - 256)
    };
  }

  function quantizeSprites(rgba, universal, options = {}) {
    const converted = imageToMasterIndices(rgba, options);
    const items = [];
    for (let ty = 0; ty < 30; ty += 1) {
      for (let tx = 0; tx < 32; tx += 1) {
        const hist = new Map();
        let weight = 0;
        for (let y = 0; y < 8; y += 1) {
          for (let x = 0; x < 8; x += 1) {
            const pixel = (ty * 8 + y) * WIDTH + tx * 8 + x;
            if (converted.alpha[pixel] > 48) {
              const color = converted.indices[pixel];
              hist.set(color, (hist.get(color) || 0) + 1);
              weight += 1;
            }
          }
        }
        if (weight) items.push({ hist, weight, tx, ty });
      }
    }
    const clustered = clusterHistograms(items, null, 4, 3);
    const palettes = clustered.palettes.map((palette) => [universal].concat(palette));
    const chr = new Uint8Array(4096);
    const oam = new Uint8Array(256);
    oam.fill(0xff);
    const used = Math.min(64, items.length);
    const scanlines = new Uint8Array(240);
    for (let itemIndex = 0; itemIndex < used; itemIndex += 1) {
      const item = items[itemIndex];
      const group = clustered.assignments[itemIndex];
      const slots = new Uint8Array(64);
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          const pixel = (item.ty * 8 + y) * WIDTH + item.tx * 8 + x;
          if (converted.alpha[pixel] > 48) {
            slots[y * 8 + x] = nearestFromPalette(converted.indices[pixel], clustered.palettes[group]) + 1;
          }
        }
      }
      chr.set(encodeTile(slots), itemIndex * 16);
      oam[itemIndex * 4] = (item.ty * 8 - 1) & 0xff;
      oam[itemIndex * 4 + 1] = itemIndex;
      oam[itemIndex * 4 + 2] = group & 3;
      oam[itemIndex * 4 + 3] = item.tx * 8;
      for (let y = item.ty * 8; y < Math.min(240, item.ty * 8 + 8); y += 1) scanlines[y] += 1;
    }
    return {
      palettes,
      chr,
      oam,
      spriteCount: items.length,
      storedCount: used,
      omittedCount: Math.max(0, items.length - 64),
      maxPerScanline: Math.max(...scanlines),
      items,
      assignments: clustered.assignments
    };
  }

  function renderBackground(quantized) {
    const rgba = new Uint8ClampedArray(WIDTH * HEIGHT * 4);
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const pixel = y * WIDTH + x;
        const block = (y >> 4) * 16 + (x >> 4);
        const palette = quantized.palettes[quantized.blockPalettes[block]];
        const rgb = MASTER_RGB[palette[quantized.pixelSlots[pixel]]];
        const offset = pixel * 4;
        rgba[offset] = rgb.r; rgba[offset + 1] = rgb.g; rgba[offset + 2] = rgb.b; rgba[offset + 3] = 255;
      }
    }
    return rgba;
  }

  function renderSprites(baseRgba, spriteResult, sourceRgba) {
    const rgba = new Uint8ClampedArray(baseRgba);
    const limit = Math.min(64, spriteResult.items.length);
    for (let itemIndex = 0; itemIndex < limit; itemIndex += 1) {
      const item = spriteResult.items[itemIndex];
      const palette = spriteResult.palettes[spriteResult.assignments[itemIndex]];
      for (let y = 0; y < 8; y += 1) {
        for (let x = 0; x < 8; x += 1) {
          const pixel = (item.ty * 8 + y) * WIDTH + item.tx * 8 + x;
          if (sourceRgba[pixel * 4 + 3] <= 48) continue;
          const sourceIndex = nearestMaster(sourceRgba[pixel * 4], sourceRgba[pixel * 4 + 1], sourceRgba[pixel * 4 + 2]);
          const slot = nearestFromPalette(sourceIndex, palette.slice(1)) + 1;
          const rgb = MASTER_RGB[palette[slot]];
          rgba[pixel * 4] = rgb.r; rgba[pixel * 4 + 1] = rgb.g; rgba[pixel * 4 + 2] = rgb.b; rgba[pixel * 4 + 3] = 255;
        }
      }
    }
    return rgba;
  }

  function createAssembler(origin) {
    const bytes = [];
    const labels = new Map();
    const fixups = [];
    return {
      byte(...values) { values.forEach((value) => bytes.push(value & 0xff)); },
      label(name) { labels.set(name, origin + bytes.length); },
      abs(opcode, target) { bytes.push(opcode, 0, 0); fixups.push({ type: "abs", at: bytes.length - 2, target }); },
      rel(opcode, target) { bytes.push(opcode, 0); fixups.push({ type: "rel", at: bytes.length - 1, target }); },
      data(values) { values.forEach((value) => bytes.push(value & 0xff)); },
      finish() {
        fixups.forEach((fixup) => {
          const address = labels.get(fixup.target);
          if (address === undefined) throw new Error(`Unknown label: ${fixup.target}`);
          if (fixup.type === "abs") {
            bytes[fixup.at] = address & 0xff;
            bytes[fixup.at + 1] = address >> 8;
          } else {
            const operandAddress = origin + fixup.at;
            const delta = address - (operandAddress + 1);
            if (delta < -128 || delta > 127) throw new Error(`Branch out of range: ${fixup.target}`);
            bytes[fixup.at] = delta & 0xff;
          }
        });
        return { bytes: Uint8Array.from(bytes), labels };
      }
    };
  }

  function buildRom(background, sprites) {
    const assembler = createAssembler(0x8000);
    const a = assembler;
    a.label("reset");
    a.byte(0x78, 0xd8, 0xa2, 0x40, 0x8e, 0x17, 0x40, 0xa2, 0xff, 0x9a, 0xe8);
    a.byte(0x8e, 0x00, 0x20, 0x8e, 0x01, 0x20, 0x8e, 0x10, 0x40);
    a.label("wait1"); a.byte(0x2c, 0x02, 0x20); a.rel(0x10, "wait1");
    a.label("wait2"); a.byte(0x2c, 0x02, 0x20); a.rel(0x10, "wait2");
    a.byte(0xad, 0x02, 0x20, 0xa9, 0x3f, 0x8d, 0x06, 0x20, 0xa9, 0x00, 0x8d, 0x06, 0x20, 0xa2, 0x00);
    a.label("paletteLoop"); a.abs(0xbd, "paletteData"); a.byte(0x8d, 0x07, 0x20, 0xe8, 0xe0, 0x20); a.rel(0xd0, "paletteLoop");
    a.byte(0xad, 0x02, 0x20, 0xa9, 0x20, 0x8d, 0x06, 0x20, 0xa9, 0x00, 0x8d, 0x06, 0x20);
    for (let page = 0; page < 4; page += 1) {
      a.byte(0xa2, 0x00);
      a.label(`nameLoop${page}`); a.abs(0xbd, `nametable${page}`); a.byte(0x8d, 0x07, 0x20, 0xe8); a.rel(0xd0, `nameLoop${page}`);
    }
    a.byte(0xa2, 0x00);
    a.label("oamLoop"); a.abs(0xbd, "oamData"); a.byte(0x9d, 0x00, 0x02, 0xe8); a.rel(0xd0, "oamLoop");
    a.byte(0xa9, 0x02, 0x8d, 0x14, 0x40, 0xa9, 0x00, 0x8d, 0x05, 0x20, 0x8d, 0x05, 0x20);
    a.byte(0xa9, sprites ? 0x08 : 0x00, 0x8d, 0x00, 0x20, 0xa9, sprites ? 0x1e : 0x0e, 0x8d, 0x01, 0x20);
    a.label("forever"); a.abs(0x4c, "forever");
    a.label("nmi"); a.byte(0x40);

    const backgroundPalettes = background.palettes.flat();
    const spritePalettes = sprites ? sprites.palettes.flat() : Array.from({ length: 16 }, (_, i) => i % 4 === 0 ? background.universal : 0x0f);
    a.label("paletteData"); a.data(backgroundPalettes.concat(spritePalettes));
    for (let page = 0; page < 4; page += 1) {
      a.label(`nametable${page}`); a.data(background.tiles.nametable.slice(page * 256, page * 256 + 256));
    }
    a.label("oamData"); a.data(sprites ? sprites.oam : new Uint8Array(256).fill(0xff));
    const assembled = a.finish();
    if (assembled.bytes.length > 0x3ffa) throw new Error("PRG data exceeds NROM-128 capacity");
    const prg = new Uint8Array(16384);
    prg.fill(0xff);
    prg.set(assembled.bytes);
    const nmi = assembled.labels.get("nmi");
    const reset = assembled.labels.get("reset");
    prg.set([nmi & 0xff, nmi >> 8, reset & 0xff, reset >> 8, nmi & 0xff, nmi >> 8], 0x3ffa);
    const chr = new Uint8Array(8192);
    chr.set(background.tiles.chr, 0);
    if (sprites) chr.set(sprites.chr, 4096);
    const header = Uint8Array.from([0x4e,0x45,0x53,0x1a,1,1,0,0,0,0,0,0,0,0,0,0]);
    const rom = new Uint8Array(header.length + prg.length + chr.length);
    rom.set(header); rom.set(prg, 16); rom.set(chr, 16 + prg.length);
    return rom;
  }

  root.NesCore = {
    WIDTH, HEIGHT, MASTER_HEX, MASTER_RGB,
    nearestMaster, quantizeBackground, reduceToNesColors, enhanceEdges, buildBackgroundTiles, quantizeSprites,
    renderBackground, renderSprites, buildRom, encodeTile
  };
})(typeof window !== "undefined" ? window : globalThis);
