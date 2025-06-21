const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database.js');

class Personal extends Model {}

Personal.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dni: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  telefono_familia: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize,
  modelName: 'Personal',
  tableName: 'personal',
  timestamps: false
});

module.exports = Personal;