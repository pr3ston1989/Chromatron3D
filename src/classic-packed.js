// The four Win32 releases store one NRV2B-LE32 block after the UPX header.
// Only its data image is needed. No native instructions are loaded or run.
export function unpackClassicImage(data) {
 const header = 0x3e0;
 const stream = header + 32;
 const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
 if (data.length < stream || view.getUint32(header) !== 0x55505821 ||
     data[header + 4] !== 12 || data[header + 6] !== 2) return null;
 const size = view.getUint32(header + 16, true);
 const end = stream + view.getUint32(header + 20, true);
 if (!size || size > 1024 * 1024 || end > data.length) throw Error('Invalid UPX image size');
 const output = new Uint8Array(size);
 let source = stream, dest = 0, word = 0, remaining = 0, distance = 1;
 function byte() {
  if (source >= end) throw Error('Truncated UPX stream');
  return data[source++];
 }
 function bit() {
  if (!remaining) {
   if (source + 4 > end) throw Error('Truncated UPX bitstream');
   word = view.getUint32(source, true);
   source += 4;
   remaining = 32;
  }
  const value = word >>> 31;
  word <<= 1;
  remaining--;
  return value;
 }
 function prefix(limit) {
  let value = 1;
  do {
   value = 2 * value + bit();
   if (value > limit) throw Error('Invalid UPX prefix');
  } while (!bit());
  return value;
 }
 while (true) {
  while (bit()) {
   if (dest >= size) throw Error('Invalid UPX literal');
   output[dest++] = byte();
  }
  const code = prefix(0x1000002);
  if (code !== 2) {
   const offset = (code - 3) * 256 + byte();
   if (offset === 0xffffffff) break;
   distance = offset + 1;
  }
  let length = 2 * bit() + bit();
  if (!length) length = prefix(size) + 2;
  length += distance > 0xd00 ? 2 : 1;
  if (distance > dest || dest + length > size) throw Error('Invalid UPX match');
  for (let i = 0; i < length; i++, dest++) output[dest] = output[dest - distance];
 }
 if (dest !== size || source !== end) throw Error('Incomplete UPX image');
 let a=1,b=0;
 for(const value of output){a=(a+value)%65521;b=(b+a)%65521}
 if(b*65536+a!==view.getUint32(header+8,true))throw Error('UPX data checksum mismatch');
 return output;
}
