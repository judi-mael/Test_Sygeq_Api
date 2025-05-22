'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Logins', {
      id: {
        type: Sequelize.BIGINT(20),
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.BIGINT(20),
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      identifiant: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: false
      },
      statut: {
        type: Sequelize.ENUM('Compte inexistant', 'Mot de passe erroné', 'Succès'),
        allowNull: false
      },
      ip: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: false
      },
      appareil: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: true
      },
      localisation: {
        type: Sequelize.STRING(191),
        defaultValue: '',
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Logins');
  }
};