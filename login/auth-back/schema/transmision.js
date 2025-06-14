import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js'; // Assuming you have a database connection configured

class Transmision extends Model {}

Transmision.init({
  // Primary key (auto-incrementing ID)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Device identification
  imei: {
    type: DataTypes.STRING(20),
    allowNull: false,
    index: true // Index for faster queries by IMEI
  },
  
  // Command information
  commandId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  // Record timestamp (crucial for time-based queries)
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    index: true // Index for faster queries by time
  },
  
  // GPS position data
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false
  },
  
  // Optional record metadata
  recordIndex: {
    type: DataTypes.INTEGER,
  },
  timestampExtension: {
    type: DataTypes.INTEGER
  },
  recordExtension: {
    type: DataTypes.INTEGER
  },
  priority: {
    type: DataTypes.INTEGER
  },
  
  // Additional GPS data
  altitude: {
    type: DataTypes.DECIMAL(7, 1)
  },
  angle: {
    type: DataTypes.DECIMAL(5, 1)
  },
  satellites: {
    type: DataTypes.INTEGER
  },
  speed: {
    type: DataTypes.INTEGER
  },
  hdop: {
    type: DataTypes.DECIMAL(3, 1)
  },
  eventId: {
    type: DataTypes.INTEGER
  },
  
  // Store complex IO elements as JSON
  ioElements: {
    type: DataTypes.JSON
  },
  
  // Additional fields for analysis
  processedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Transmision',
  tableName: 'transmision',
  indexes: [
    // Composite index for querying by device and time range efficiently
    {
      name: 'idx_imei_timestamp',
      fields: ['imei', 'timestamp']
    },
    // Index for spatial queries - depends on database engine
    // Note: For proper spatial indexing, consider using PostGIS extension
    // or equivalent spatial features of your database
  ]
});

// Helper method for calculating distance between two points
Transmision.getDistance = function(lat1, lon1, lat2, lon2) {
  // Implementation of the Haversine formula for distance calculation
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in km
  return distance;
};

// Helper method to get the latest position for a device
Transmision.getLatestPosition = async function(imei) {
  return this.findOne({
    where: { imei },
    order: [['timestamp', 'DESC']]
  });
};

// Helper method to get positions within a time range
Transmision.getPositionsInTimeRange = async function(imei, startTime, endTime) {
  return this.findAll({
    where: {
      imei,
      timestamp: {
        [Op.between]: [startTime, endTime]
      }
    },
    order: [['timestamp', 'ASC']]
  });
};

export default Transmision;