using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeadDrop.Migrations.DropLink
{
    /// <inheritdoc />
    public partial class AddStorageFileId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "StorageFileId",
                table: "Drops",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StorageFileId",
                table: "Drops");
        }
    }
}
