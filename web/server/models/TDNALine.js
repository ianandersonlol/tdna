const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Gene = require('./Gene');

const TDNALine = sequelize.define('TDNALine', {
  line_id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
    allowNull: false
  },
  target_gene: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: Gene,
      key: 'gene_id'
    }
  },
  hit_region: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  homozygosity_status: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  stock_center_status: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'tdna_lines',
  timestamps: false
});

// Define association
TDNALine.belongsTo(Gene, { foreignKey: 'target_gene' });
Gene.hasMany(TDNALine, { foreignKey: 'target_gene' });

module.exports = TDNALine;