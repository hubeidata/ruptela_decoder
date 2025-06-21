const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// Create Sequelize instance - uses environment variables or default values
const sequelize = new Sequelize(
  process.env.DB_NAME || 'santiago',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'blf278',
  {
    host: process.env.DB_HOST || 'postgres',
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;