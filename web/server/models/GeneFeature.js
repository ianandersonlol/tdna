const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Gene = require('./Gene');

const GeneFeature = sequelize.define('GeneFeature', {
  feature_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  gene_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: Gene,
      key: 'gene_id'
    }
  },
  chromosome: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50),
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
  }
}, {
  tableName: 'gene_features',
  timestamps: false
});

// Define association
GeneFeature.belongsTo(Gene, { foreignKey: 'gene_id' });
Gene.hasMany(GeneFeature, { foreignKey: 'gene_id' });

module.exports = GeneFeature;