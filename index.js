const i2c = require('i2c-bus');

module.exports = function(app) {
  const plugin = {};
  plugin.id = 'signalk-hmc5883l';
  plugin.name = 'HMC5883L I2C Compass';
  plugin.description = 'Reads compass heading from HMC5883L via I2C with configurable offsets';

  // Schema pour l'interface web Signal K
  plugin.schema = {
    type: 'object',
    properties: {
      i2cBus: { type: 'number', title: 'I2C Bus Number', default: 0 },
      i2cAddress: { type: 'number', title: 'I2C Address (decimal)', default: 30 },
      readInterval: { type: 'number', title: 'Read interval (ms)', default: 500 },
      offsetX: { type: 'number', title: 'Offset X', default: 0 },
      offsetY: { type: 'number', title: 'Offset Y', default: 0 },
      offsetZ: { type: 'number', title: 'Offset Z', default: 0 },
      invertHeading: {
        type: 'boolean',
        title: 'Invert heading (180°)',
        default: false
      },
      reverseRotation: {
        type: 'boolean',
        title: 'Reverse rotation (East/West swapped)',
        default: false
      },
      headingOffsetRad: {
        type: 'number',
        title: 'Heading angular offset (radians)',
        default: 0
      },
      debug: { type: 'boolean', title: 'Enable debug logging', default: false }
    }
  };

  let bus;
  let interval;
  let optionsGlobal;

  // Fonction de lecture du compas
  function readCompass() {
    try {
      const buffer = Buffer.alloc(6);
      bus.readI2cBlockSync(optionsGlobal.i2cAddress, 0x03, 6, buffer);

      // Lecture brute et application des offsets
      let x = buffer.readInt16BE(0) - (optionsGlobal.offsetX || 0);
      let z = buffer.readInt16BE(2) - (optionsGlobal.offsetZ || 0);
      let y = buffer.readInt16BE(4) - (optionsGlobal.offsetY || 0);

      // Calcul heading
      // Calcul brut
      let heading = Math.atan2(y, -x) + Math.PI / 2;

      // Inversion 180°
      if (optionsGlobal.invertHeading) {
        heading += Math.PI;
      }

      // Inversion du sens de rotation
      if (optionsGlobal.reverseRotation) {
        heading = (2 * Math.PI) - heading;
      }

      // Offset angulaire utilisateur
      heading += (optionsGlobal.headingOffsetRad || 0);

      // Normalisation 0 → 2π
      heading = heading % (2 * Math.PI);
      if (heading < 0) heading += 2 * Math.PI;

      // Publication Signal K
      app.handleMessage(plugin.id, {
        updates: [
          {
            values: [
              { path: 'navigation.headingMagnetic', value: heading }
            ]
          }
        ]
      });

      if (optionsGlobal.debug) {
        app.debug(`HMC5883L heading(rad): ${heading.toFixed(4)}, X:${x} Y:${y} Z:${z}`);
      }

    } catch (err) {
      app.error('HMC5883L read error: ' + err.message);
    }
  }

  // Démarrage du plugin
  plugin.start = function(options) {
    optionsGlobal = options; // stocker options pour lecture

    try {
      const busNumber = options.i2cBus !== undefined ? options.i2cBus : 0;
      bus = i2c.openSync(busNumber);

      // Configuration du HMC5883L
      bus.writeByteSync(options.i2cAddress, 0x00, 0x70);
      bus.writeByteSync(options.i2cAddress, 0x01, 0xA0);
      bus.writeByteSync(options.i2cAddress, 0x02, 0x00);

      interval = setInterval(readCompass, options.readInterval);

      if (options.debug) {
        app.debug(`HMC5883L plugin started on bus ${busNumber}, addr 0x${options.i2cAddress.toString(16)}`);
      }

    } catch (err) {
      app.error('HMC5883L init error: ' + err.message);
    }
  };

  // Arrêt du plugin
  plugin.stop = function() {
    if (interval) clearInterval(interval);
    if (bus) bus.closeSync();
    app.debug('HMC5883L stopped');
  };

  return plugin;
};
