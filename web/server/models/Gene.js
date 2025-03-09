const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gene = sequelize.define('Gene', {
  gene_id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  chromosome: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  start_position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  end_position: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  strand: {
    type: DataTypes.CHAR(1),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'genes',
  timestamps: false
});

module.exports = Gene;