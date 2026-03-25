exports.up = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.text("cw_config").nullable().defaultTo(null);
    });
};

exports.down = function (knex) {
    return knex.schema.alterTable("monitor", function (table) {
        table.dropColumn("cw_config");
    });
};
