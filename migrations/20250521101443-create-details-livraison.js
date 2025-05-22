'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DetailsLivraisons', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true
      },
      bonlivraison_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'BonLivraisons',
          key: 'id'
        }
      },
      produit_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Produits',
          key: 'id'
        }
      },
      qtte_avant_livraison: {
        type: Sequelize.STRING(191),
        allowNull: true
      },
      qtte: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      qtte_apres_livraison: {
        type: Sequelize.STRING(191),
        allowNull: true
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
    await queryInterface.dropTable('DetailsLivraisons');
  }
};