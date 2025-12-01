
import { Component } from '@angular/core';
import { RouterModule, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
  menuOpciones = [
    { label: 'Inicio', ruta: '/citas' },
    { label: 'Reservar cita', ruta: '/reservar-cita' },
    { label: 'Mis citas', ruta: '/mis-citas' },
    { label: 'Salir', accion: () => this.irLogin() }
  ];

    constructor(private supabase: SupabaseService,private router: Router ){}// 👈 ¡Inyectar el Router! {}

  irLogin() {
    this.router.navigate(['/login']);
  }
}
