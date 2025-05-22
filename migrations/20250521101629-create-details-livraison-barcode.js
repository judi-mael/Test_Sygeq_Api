'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DetailsLivraisonBarcodes', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true
      },
      detailslivraison_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'DetailsLivraisons',
          key: 'id'
        },
      },
      qty: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      creu_charger: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      barcode: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      compartiment_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Compartiments',
          key: 'id'
        }
      },
      createdBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      updatedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      deletedBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true
      },
      restoredBy: {
        type: Sequelize.INTEGER(11),
        allowNull: true
      },
      suspensionComment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('DetailsLivraisonBarcodes');
  }
};