using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DeadDrop.Migrations.DropLink
{
    /// <inheritdoc />
    public partial class AddInviteCodePlaintextCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "InviteCodes",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Code",
                table: "InviteCodes");
        }
    }
}
