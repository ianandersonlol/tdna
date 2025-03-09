const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const TDNALine = require('./TDNALine');

const TDNAPosition = sequelize.define('TDNAPosition', {
  position_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  line_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: TDNALine,
      key: 'line_id'
    }
  },
  chromosome: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'tdna_positions',
  timestamps: false
});

// Define association
TDNAPosition.belongsTo(TDNALine, { foreignKey: 'line_id' });
TDNALine.hasMany(TDNAPosition, { foreignKey: 'line_id' });

module.exports = TDNAPosition;