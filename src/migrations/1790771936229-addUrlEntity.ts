import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUrlEntity1790771936229 implements MigrationInterface {
    name = 'AddUrlEntity1790771936229'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "urls" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalUrl" character varying(2048) NOT NULL, "shortCode" character varying(12) NOT NULL, "userId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_34ced802e4a45bf6a6346f2eb97" UNIQUE ("shortCode"), CONSTRAINT "PK_eaf7bec915960b26aa4988d73b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "urls" ADD CONSTRAINT "FK_3088b58113241e3f5f6c10cf1fb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "urls" DROP CONSTRAINT "FK_3088b58113241e3f5f6c10cf1fb"`);
        await queryRunner.query(`DROP TABLE "urls"`);
    }

}
