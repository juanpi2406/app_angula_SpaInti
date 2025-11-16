import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-citas-opciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './citas-opciones.html',
  styleUrls: ['./citas-opciones.css']
})
export class CitasOpciones {

  constructor(private router: Router) {}

  irCitasPorServicio() {
    this.router.navigate(['/citas-por-servicio']);
  }

  irCitasPorEspecialista() {
    this.router.navigate(['/citas-por-especialista']);
  }


  irLogin() {
    this.router.navigate(['/login']);
  }
   irInicio() {
    this.router.navigate(['/citas2']);
  }
    irReservarCita() {
    this.router.navigate(['/citas-opciones']);
  }

}
