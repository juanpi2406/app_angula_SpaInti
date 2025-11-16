import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email = '';
  password = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}
async login() {
  try {
    const { data, error } = await this.supabaseService.signInWithEmail(
      this.email,
      this.password
    );

    if (error) {
      // Manejo de errores de Supabase: credenciales inválidas, etc.
      alert('❌ Error al iniciar sesión: ' + error.message);
      return;
    }

    // Si data.session existe, el inicio de sesión fue exitoso.
    if (data.session) {
      console.log('✅ Sesión iniciada y lista:', data.session);
      // Redirigir inmediatamente al dashboard
      this.router.navigate(['/citas2']);
    } else {
      // Esto es un caso raro, pero maneja la posibilidad de un login sin sesión activa
      alert('⚠️ Inicio de sesión exitoso, pero la sesión no está activa. Intente de nuevo.');
    }

  } catch (err) {
    console.error(err);
    alert('❌ Error inesperado al iniciar sesión');
  }
}



}
