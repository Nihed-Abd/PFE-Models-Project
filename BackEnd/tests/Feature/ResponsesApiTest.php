<?php

namespace Tests\Feature;
use App\Models\Response;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ResponsesApiTest extends TestCase
{
    public function test_example(){

    $response = $this->getJson('/api/responses');

$response->assertStatus(200);

$response->assertJsonStructure([
    'total',
    'responses' => [
        '*' => ['question_id', 'content']
    ]
]);
    }
}
