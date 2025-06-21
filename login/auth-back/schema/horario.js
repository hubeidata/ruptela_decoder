const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database.js');
const Personal = require('./personal.js');
const Maquinaria = require('./maquinaria.js');

class Horario extends Model {}

Horario.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  id_persona: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Personal,
      key: 'id'
    }
  },
  id_maquinaria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Maquinaria,
      key: 'id'
    }
  },
  fecha_inicio: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fecha_final: {
    type: DataTypes.DATE,
    allowNull: false
  },
  usuario_asigno: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'Horario',
  tableName: 'horario',
  timestamps: false
});

Personal.hasMany(Horario, { foreignKey: 'id_persona' });
Maquinaria.hasMany(Horario, { foreignKey: 'id_maquinaria' });
Horario.belongsTo(Personal, { foreignKey: 'id_persona' });
Horario.belongsTo(Maquinaria, { foreignKey: 'id_maquinaria' });

module.exports = Horario;