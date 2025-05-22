'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Camions', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true
      },
      ssat_id: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      imat: {
        type: Sequelize.STRING(191),
        allowNull: false,
        unique: true
      },
      nbrVanne: {
        type: Sequelize.INTEGER(11),
        allowNull: false
      },
      annee: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      isactive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      marque: {
        type: Sequelize.STRING(191),
        allowNull: false
      },
      transporteur_id: {
        type: Sequelize.BIGINT(20),
        allowNull: false,
        references: {
          model: 'Transporteurs',
          key: 'id'
        }, 
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      filling_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      marketer_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references: {
          model: 'Marketers',
          key: 'id'
        }, 
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
    await queryInterface.dropTable('Camions');
  }
};