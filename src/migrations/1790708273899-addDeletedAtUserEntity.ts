import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDeletedAtUserEntity1790708273899 implements MigrationInterface {
    name = 'AddDeletedAtUserEntity1790708273899'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "deletedAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deletedAt"`);
    }

}
