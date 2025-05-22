'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('DetailsVilles', 'tarif_gpl_vrac', {
      type: Sequelize.DOUBLE(8,2),
      allowNull: true
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('DetailsVille', 'tarif_gpl_vrac');
  }
};
