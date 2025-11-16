// src/app/pages/register/register.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  nombre = '';
apellido = '';
  email = '';
  password = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async register() {
    if (!this.email || !this.password) {
      alert('Por favor ingresa un correo y una contraseña.');
      return;
    }

    console.log('Intentando registrar:', this.email);

    const { data, error } = await this.supabase.signUp(this.email, this.password);

    if (error) {
      alert('Error: ' + error.message);
      return;
    }

    const user = data.user;
    if (user) {
    const { error: clienteError } = await this.supabase.client
  .from('clientes')
  .insert([{
    auth_user_id: user.id,
    correo: this.email,
    nombres: this.nombre,
    apellidos: this.apellido
  }]);





      if (clienteError) {
        console.error('Error creando perfil:', clienteError.message);
        alert('Hubo un problema creando tu perfil: ' + clienteError.message);
        return;
      } else {
        console.log('Perfil creado correctamente para:', user.email);
      }
    }

    alert('✅ Usuario creado correctamente. Ahora puedes iniciar sesión.');
    this.router.navigate(['/login']); // Redirige al login
  }
}
