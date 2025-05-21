<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    /**
     * A basic feature test example.
     */

     public function test_can_get_all_user()
     {
         $response = $this->getJson('/api/users');
         $response->assertStatus(200);
         $response->assertJsonStructure([
             '*' => ['name', 'email', 'password']
         ]);
     }
     }
