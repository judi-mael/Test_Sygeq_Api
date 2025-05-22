'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Compartiments', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true
      },
      camion_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Camions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      numero: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      capacite: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      is_busy: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.dropTable('Compartiments');
  }
};