'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Structures', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      produitId: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references:{
          model:'Produits',
          key:'id'
        }
      },
      tauxPereq: {
        type: Sequelize.DOUBLE(8,2),
        allowNull: false,
      },
      tauxTransportInterDepot: {
        type: Sequelize.DOUBLE(8,2),
        allowNull: true,
      },
      tauxDifferentielTransport: {
        type: Sequelize.DOUBLE(8,2),
        allowNull: true,
      },
      differentiel: {
        type: Sequelize.DOUBLE(8,2),
        allowNull: true,
      },
      caisse: {
        type: Sequelize.DOUBLE(8,2),
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
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      restoredBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true,
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
    await queryInterface.dropTable('Structures');
  }
};