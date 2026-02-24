# signalk-hmc5883l
Plugin Signalk for i2c hmc5883l

Ce plugin lit la direction magnétique à partir du capteur HMC5883L via I2C et publie la valeur sur Signal K.  
La calibration se fait avec un script séparé.

---

## Installation

1. Copier le dossier `signalk-hmc5883l` dans `~/.signalk/node_modules/`
2. Installer les dépendances:

```bash
cd ~/.signalk/node_modules/signalk-hmc5883l
npm install

# Error: Could not locate the bindings file
Si vous obtenez une erreur dans signal,
  ouvrez une console
  allez dans le repertoire de signalk (cd ~/.signalk)
  npm rebuild

## Calibration
# Lancer sur bus 0 et adresse 0x1E(30 en decimal) par défaut
node calibrate-hmc5883l.js

# Ou spécifier bus et adresse
node calibrate-hmc5883l.js <bus> <adresse>
# Exemples :
# Odroid N2, adresse 30 : node calibrate-hmc5883l.js 0 30
# Raspberry Pi, adresse 30 : node calibrate-hmc5883l.js 1 30

#Note:
Sur mon module, j'ai des axes inversés. 
Des options ont été ajoutés.
