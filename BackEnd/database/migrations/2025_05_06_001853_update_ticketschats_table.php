<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateTicketschatsTable extends Migration
{
    public function up()
    {
        Schema::table('ticketschats', function (Blueprint $table) {
            // Remplacer l'ancien champ evaluation
            if (Schema::hasColumn('ticketschats', 'evaluation')) {
                $table->dropColumn('evaluation');
            }

            $table->enum('evaluation', ['jaime', 'jenaimepas'])->nullable()->after('status');

            // Ajouter conversation_id
            if (!Schema::hasColumn('ticketschats', 'conversation_id')) {
                $table->foreignId('conversation_id')->nullable()->constrained()->onDelete('cascade')->after('user_id');
            }

            // Ajouter commentaire pour l’admin
            if (!Schema::hasColumn('ticketschats', 'commentaire_admin')) {
                $table->text('commentaire_admin')->nullable()->after('response');
            }
        });
    }

    public function down()
    {
        Schema::table('ticketschats', function (Blueprint $table) {
            $table->dropColumn(['evaluation', 'conversation_id', 'commentaire_admin']);
        });
    }
}
