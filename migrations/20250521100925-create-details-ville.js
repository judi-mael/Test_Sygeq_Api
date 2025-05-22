'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DetailsVilles', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      depot_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Depots',
          key: 'id',
        },
      },
      ville_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Villes',
          key: 'id',
        },
      },
      difficultee: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      distance: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      prime: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      tarif_produits_blanc: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      tarif_gpl: {
        type: Sequelize.DOUBLE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      updatedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
      },
      deletedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
      },
      restoredBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      suspensionComment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DetailsVilles');
  }
};