const i2c = require('i2c-bus');

const busNumber = parseInt(process.argv[2]) || 0;
const address = parseInt(process.argv[3]) || 30;

const bus = i2c.openSync(busNumber);
bus.writeByteSync(address, 0x00, 0x70);
bus.writeByteSync(address, 0x01, 0xA0);
bus.writeByteSync(address, 0x02, 0x00);

let calibData = {
  xMin: Infinity, xMax: -Infinity,
  yMin: Infinity, yMax: -Infinity,
  zMin: Infinity, zMax: -Infinity
};

console.log(`Calibration started on bus ${busNumber}, addr 0x${address.toString(16)}`);
console.log('Move the sensor in all directions. Press Ctrl+C to finish.');

const interval = setInterval(() => {
  const buffer = Buffer.alloc(6);
  bus.readI2cBlockSync(address, 0x03, 6, buffer);

  const x = buffer.readInt16BE(0);
  const z = buffer.readInt16BE(2);
  const y = buffer.readInt16BE(4);

  calibData.xMin = Math.min(calibData.xMin, x);
  calibData.xMax = Math.max(calibData.xMax, x);
  calibData.yMin = Math.min(calibData.yMin, y);
  calibData.yMax = Math.max(calibData.yMax, y);
  calibData.zMin = Math.min(calibData.zMin, z);
  calibData.zMax = Math.max(calibData.zMax, z);
}, 200);

process.on('SIGINT', () => {
  clearInterval(interval);
  bus.closeSync();

  const offsetX = (calibData.xMax + calibData.xMin) / 2;
  const offsetY = (calibData.yMax + calibData.yMin) / 2;
  const offsetZ = (calibData.zMax + calibData.zMin) / 2;

  console.log('Calibration finished. Offsets:');
  console.log(`offsetX = ${offsetX}`);
  console.log(`offsetY = ${offsetY}`);
  console.log(`offsetZ = ${offsetZ}`);
  process.exit(0);
});
