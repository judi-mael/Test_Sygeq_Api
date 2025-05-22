'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Contrats', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true
      },
      marketer_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Marketers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      transporteur_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Transporteurs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      statut: {
        type: Sequelize.ENUM('En attente', 'Approuvé', 'Rejeté', 'Annulé'),
        allowNull: false,
        defaultValue: 'En attente'
      },
      commentaire: {
        type: Sequelize.TEXT,
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
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Contrats');
  }
};