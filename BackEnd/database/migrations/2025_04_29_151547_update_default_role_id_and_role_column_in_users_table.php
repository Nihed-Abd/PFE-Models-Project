<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateDefaultRoleIdAndRoleColumnInUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Nécessite doctrine/dbal pour `change()`
            $table->foreignId('role_id')->default(2)->change();
            $table->string('role')->default('client')->change();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Tu peux enlever les valeurs par défaut si tu veux revenir en arrière
            $table->foreignId('role_id')->default(null)->change();
            $table->string('role')->default(null)->change();
        });
    }
}
