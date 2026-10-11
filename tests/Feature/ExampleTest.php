<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    public function test_guests_are_redirected_to_login_from_the_home_page(): void
    {
        $response = $this->get('/');

        $response->assertRedirect(route('login'));
    }
}
