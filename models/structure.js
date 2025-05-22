'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Structure extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Structure.belongsTo(models.Produit, {
                foreignKey: 'produitId',
            });
        }
    }
    Structure.init({
        id: {
            type: DataTypes.BIGINT(20),
            primaryKey: true,
            autoIncrement: true
        },
        produitId: {
            type: DataTypes.BIGINT(20),
            allowNull: false,
            references: {
                model: "Produit",
                key: "id"
            }
        },
        tauxPereq: {
            type: DataTypes.DOUBLE(8, 2),
            allowNull: false
        },
        tauxTransportInterDepot: {
            type: DataTypes.DOUBLE(8, 2),
            allowNull: true
        },
        tauxDifferentielTransport: {
            type: DataTypes.DOUBLE(8, 2),
            allowNull: true
        },
        differentiel: {
            type: DataTypes.DOUBLE(8, 2),
            allowNull: true
        },
        caisse: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        caisseB2B: {
            type: DataTypes.DOUBLE,
            allowNull: true
        },
        dateAppl: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        dateExp: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        createdBy: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        updatedBy: {
            type: DataTypes.INTEGER(11),
            allowNull: false
        },
        deletedBy: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        restoredBy: {
            type: DataTypes.INTEGER(11),
            allowNull: true
        },
        suspensionComment: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Structure',
        paranoid: true,
        timestamps: true,
        hooks: {
            beforeCreate: async (instance, options) => {
                instance.createdAt = new Date();
                instance.updatedAt = new Date();
            },
            beforeUpdate: (instance, options) => {
                instance.updatedAt = new Date();
            }
        }
    });
    return Structure;
};