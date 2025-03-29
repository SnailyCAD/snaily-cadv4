import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("einsatzprotokoll_feuerwehr", (table) => {
    table.increments("id").primary();
    table.timestamp("datum").notNullable();
    table.string("einsatzort").notNullable();
    table.text("beschreibung").notNullable();
    table.integer("erstellt_von").references("id").inTable("users");
    table.timestamp("erstellt_am").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("einsatzprotokoll_rettungsdienst", (table) => {
    table.increments("id").primary();
    table.timestamp("datum").notNullable();
    table.string("einsatzort").notNullable();
    table.text("beschreibung").notNullable();
    table.integer("erstellt_von").references("id").inTable("users");
    table.timestamp("erstellt_am").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("einsatzprotokoll_lna_orgl", (table) => {
    table.increments("id").primary();
    table.timestamp("datum").notNullable();
    table.string("einsatzort").notNullable();
    table.text("beschreibung").notNullable();
    table.integer("erstellt_von").references("id").inTable("users");
    table.timestamp("erstellt_am").defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("einsatzprotokoll_feuerwehr");
  await knex.schema.dropTableIfExists("einsatzprotokoll_rettungsdienst");
  await knex.schema.dropTableIfExists("einsatzprotokoll_lna_orgl");
}
