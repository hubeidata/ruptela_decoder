const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database.js');

class Maquinaria extends Model {}

Maquinaria.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre_maquinaria: {
    type: DataTypes.STRING,
    allowNull: false
  },
  imei: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Maquinaria',
  tableName: 'maquinaria',
  timestamps: false
});

module.exports = Maquinaria;